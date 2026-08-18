import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { getRedisClient } from "@/config/redis";
import { normalizePhoneNumber } from "@/utils/phone.util";
import { smsLogService } from "../sms/sms-log.service";
import {
  IOtpRateLimitBlock,
  IOtpRateLimitConfig,
  OtpRateLimitMeta,
} from "../sms/sms.interface";

export const OTP_RATE_LIMIT_KEY_PREFIX = "otp_limit:";
export const OTP_RATE_LIMIT_CONFIG_KEY = "otp_limit:config";

export const DEFAULT_OTP_RATE_LIMIT_CONFIG: IOtpRateLimitConfig = {
  maxAttempts: Number(process.env.OTP_RATE_LIMIT_MAX || 3),
  windowHours: Number(process.env.OTP_RATE_LIMIT_WINDOW_HOURS || 25),
};

const buildResetIn = (ttlSeconds: number): string =>
  new Date(Date.now() + Math.max(ttlSeconds, 0) * 1000).toISOString();

class OtpRateLimitService {
  private buildKey(phoneNumber: string): string {
    return `${OTP_RATE_LIMIT_KEY_PREFIX}${normalizePhoneNumber(phoneNumber)}`;
  }

  private getWindowSeconds(config: IOtpRateLimitConfig): number {
    return config.windowHours * 3600;
  }

  getConfig = async (): Promise<IOtpRateLimitConfig> => {
    try {
      const redis = getRedisClient();
      const raw = await redis.get(OTP_RATE_LIMIT_CONFIG_KEY);

      if (!raw) {
        return DEFAULT_OTP_RATE_LIMIT_CONFIG;
      }

      const parsed = JSON.parse(raw) as Partial<IOtpRateLimitConfig>;

      return {
        maxAttempts:
          parsed.maxAttempts ?? DEFAULT_OTP_RATE_LIMIT_CONFIG.maxAttempts,
        windowHours:
          parsed.windowHours ?? DEFAULT_OTP_RATE_LIMIT_CONFIG.windowHours,
      };
    } catch (error) {
      console.error("[OTP Rate Limit] Failed to read config:", error);
      return DEFAULT_OTP_RATE_LIMIT_CONFIG;
    }
  };

  updateConfig = async (
    payload: Partial<IOtpRateLimitConfig>
  ): Promise<IOtpRateLimitConfig> => {
    const current = await this.getConfig();
    const nextConfig: IOtpRateLimitConfig = {
      maxAttempts: payload.maxAttempts ?? current.maxAttempts,
      windowHours: payload.windowHours ?? current.windowHours,
    };

    const redis = getRedisClient();
    await redis.set(OTP_RATE_LIMIT_CONFIG_KEY, JSON.stringify(nextConfig));

    return nextConfig;
  };

  listBlocks = async (): Promise<IOtpRateLimitBlock[]> => {
    try {
      const redis = getRedisClient();
      const config = await this.getConfig();
      const keys = await redis.keys(`${OTP_RATE_LIMIT_KEY_PREFIX}*`);

      const blocks = await Promise.all(
        keys
          .filter((key) => key !== OTP_RATE_LIMIT_CONFIG_KEY)
          .map(async (key) => {
            const phoneNumber = key.replace(OTP_RATE_LIMIT_KEY_PREFIX, "");
            const count = Number.parseInt((await redis.get(key)) || "0", 10);
            const ttl = await redis.ttl(key);

            return {
              phone_number: phoneNumber,
              attempts_used: count,
              max_attempts: config.maxAttempts,
              remaining_attempts: Math.max(0, config.maxAttempts - count),
              is_blocked: count >= config.maxAttempts,
              ttl_seconds: ttl,
              reset_at: buildResetIn(ttl),
            };
          })
      );

      return blocks.sort((a, b) => {
        if (a.is_blocked !== b.is_blocked) {
          return a.is_blocked ? -1 : 1;
        }

        return b.attempts_used - a.attempts_used;
      });
    } catch (error) {
      console.error("[OTP Rate Limit] Failed to list blocks:", error);
      return [];
    }
  };

  clearBlock = async (phoneNumber: string): Promise<number> => {
    const redis = getRedisClient();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const deleted = await redis.del(this.buildKey(normalizedPhone));

    if (deleted === 0) {
      const keys = await redis.keys(`${OTP_RATE_LIMIT_KEY_PREFIX}*`);
      const matchingKeys = keys.filter((key) => {
        if (key === OTP_RATE_LIMIT_CONFIG_KEY) {
          return false;
        }

        const storedPhone = key.replace(OTP_RATE_LIMIT_KEY_PREFIX, "");
        return (
          storedPhone === phoneNumber.trim() || storedPhone === normalizedPhone
        );
      });

      if (matchingKeys.length === 0) {
        return 0;
      }

      return redis.del(...matchingKeys);
    }

    return deleted;
  };

  clearAllBlocks = async (): Promise<number> => {
    const redis = getRedisClient();
    const keys = await redis.keys(`${OTP_RATE_LIMIT_KEY_PREFIX}*`);
    const blockKeys = keys.filter((key) => key !== OTP_RATE_LIMIT_CONFIG_KEY);

    if (blockKeys.length === 0) {
      return 0;
    }

    return redis.del(...blockKeys);
  };

  assertCanSendOtp = async (phoneNumber: string): Promise<OtpRateLimitMeta> => {
    const trimmedPhone = phoneNumber.trim();
    const config = await this.getConfig();
    const maxAttempts = config.maxAttempts;
    const windowSeconds = this.getWindowSeconds(config);

    try {
      const redis = getRedisClient();
      const key = this.buildKey(trimmedPhone);
      const current = await redis.get(key);
      const count = current ? Number.parseInt(current, 10) : 0;

      if (count >= maxAttempts) {
        const ttl = await redis.ttl(key);
        const resetIn = buildResetIn(ttl);

        await smsLogService.logOtpBlockEvent({
          phone_number: normalizePhoneNumber(trimmedPhone),
          attempts_used: count,
          max_attempts: maxAttempts,
          reset_at: resetIn,
        });

        throw new ApiError(
          HttpStatusCode.TOO_MANY_REQUESTS,
          "Too many OTP requests. Please try again later.",
          {
            remainingAttempts: 0,
            resetIn,
          }
        );
      }

      const newCount = await redis.incr(key);
      if (newCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);

      return {
        remainingAttempts: Math.max(0, maxAttempts - newCount),
        resetIn: buildResetIn(ttl),
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error(
        "[OTP Rate Limit] Redis error, skipping rate limit check:",
        error
      );

      return {
        remainingAttempts: maxAttempts,
        resetIn: buildResetIn(windowSeconds),
      };
    }
  };
}

export const otpRateLimitService = new OtpRateLimitService();
