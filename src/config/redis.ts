import Redis from "ioredis";
import { envConfig } from "@/config/index";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(envConfig.redis.url, {
      maxRetriesPerRequest: 3,
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    console.info("[Redis] Connected successfully");
    return true;
  } catch (error) {
    console.warn(
      "[Redis] Connection failed. OTP rate limiting will be skipped.",
      {
        error: error instanceof Error ? error.message : error,
      }
    );
    return false;
  }
}
