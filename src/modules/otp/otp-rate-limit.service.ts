import ApiError from "@/middlewares/error";
import { HttpStatusCode } from "@/lib/httpStatus";
import { getRedisClient } from "@/config/redis";

export const OTP_RATE_LIMIT_MAX = 3;
export const OTP_RATE_LIMIT_WINDOW_SECONDS = 93600;
export const OTP_RATE_LIMIT_KEY_PREFIX = "otp_limit:";

export type OtpRateLimitMeta = {
  remainingAttempts: number;
  resetIn: string;
};

const buildResetIn = (ttlSeconds: number): string =>
  new Date(Date.now() + Math.max(ttlSeconds, 0) * 1000).toISOString();

class OtpRateLimitService {
  private buildKey(phoneNumber: string): string {
    return `${OTP_RATE_LIMIT_KEY_PREFIX}${phoneNumber.trim()}`;
  }

  async assertCanSendOtp(phoneNumber: string): Promise<OtpRateLimitMeta> {
    const trimmedPhone = phoneNumber.trim();

    try {
      const redis = getRedisClient();
      const key = this.buildKey(trimmedPhone);
      const current = await redis.get(key);
      const count = current ? Number.parseInt(current, 10) : 0;

      if (count >= OTP_RATE_LIMIT_MAX) {
        const ttl = await redis.ttl(key);
        throw new ApiError(
          HttpStatusCode.TOO_MANY_REQUESTS,
          "Too many OTP requests. Please try again later.",
          {
            remainingAttempts: 0,
            resetIn: buildResetIn(ttl),
          }
        );
      }

      const newCount = await redis.incr(key);
      if (newCount === 1) {
        await redis.expire(key, OTP_RATE_LIMIT_WINDOW_SECONDS);
      }

      const ttl = await redis.ttl(key);

      return {
        remainingAttempts: Math.max(0, OTP_RATE_LIMIT_MAX - newCount),
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
        remainingAttempts: OTP_RATE_LIMIT_MAX,
        resetIn: buildResetIn(OTP_RATE_LIMIT_WINDOW_SECONDS),
      };
    }
  }
}

export const otpRateLimitService = new OtpRateLimitService();
