import { randomUUID } from "crypto";
import { getRedisClient } from "@/config/redis";
import { IOtpBlockLog, ISmsLogEntry, ISmsLogType } from "./sms.interface";

const SMS_LOGS_KEY = "sms:logs";
const OTP_BLOCK_LOGS_KEY = "otp:block_logs";
const LOGS_MAX = 200;

class SmsLogService {
  private async pushLog<T>(key: string, entry: T) {
    try {
      const redis = getRedisClient();
      await redis.lpush(key, JSON.stringify(entry));
      await redis.ltrim(key, 0, LOGS_MAX - 1);
    } catch (error) {
      console.error(`[SMS Log] Failed to write log to ${key}:`, error);
    }
  }

  private parseLogs<T>(items: string[]): T[] {
    return items
      .map((item) => {
        try {
          return JSON.parse(item) as T;
        } catch {
          return null;
        }
      })
      .filter((item): item is T => item !== null);
  }

  logSmsEvent = async (payload: {
    phone_number: string;
    message_type: ISmsLogType;
    success: boolean;
    response_code?: number | null;
    error_message?: string;
  }) => {
    const entry: ISmsLogEntry = {
      id: randomUUID(),
      phone_number: payload.phone_number,
      message_type: payload.message_type,
      success: payload.success,
      response_code: payload.response_code ?? null,
      error_message: payload.error_message || "",
      created_at: new Date().toISOString(),
    };

    await this.pushLog(SMS_LOGS_KEY, entry);
    return entry;
  };

  logOtpBlockEvent = async (payload: {
    phone_number: string;
    attempts_used: number;
    max_attempts: number;
    reset_at: string;
  }) => {
    const entry: IOtpBlockLog = {
      id: randomUUID(),
      phone_number: payload.phone_number,
      attempts_used: payload.attempts_used,
      max_attempts: payload.max_attempts,
      reset_at: payload.reset_at,
      created_at: new Date().toISOString(),
    };

    await this.pushLog(OTP_BLOCK_LOGS_KEY, entry);
    return entry;
  };

  getSmsLogs = async (limit = 50): Promise<ISmsLogEntry[]> => {
    try {
      const redis = getRedisClient();
      const items = await redis.lrange(SMS_LOGS_KEY, 0, Math.max(limit - 1, 0));
      return this.parseLogs<ISmsLogEntry>(items);
    } catch (error) {
      console.error("[SMS Log] Failed to read SMS logs:", error);
      return [];
    }
  };

  getOtpBlockLogs = async (limit = 50): Promise<IOtpBlockLog[]> => {
    try {
      const redis = getRedisClient();
      const items = await redis.lrange(
        OTP_BLOCK_LOGS_KEY,
        0,
        Math.max(limit - 1, 0)
      );
      return this.parseLogs<IOtpBlockLog>(items);
    } catch (error) {
      console.error("[SMS Log] Failed to read OTP block logs:", error);
      return [];
    }
  };
}

export const smsLogService = new SmsLogService();
