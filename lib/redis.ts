import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  const url = process.env.REDIS_KV_REST_API_URL;
  const token = process.env.REDIS_KV_REST_API_TOKEN;

  if (
    !url ||
    !token ||
    !url.startsWith("http") ||
    url.includes("your_upstash") ||
    url.includes("your_redis")
  ) {
    return null;
  }

  if (!redisInstance) {
    try {
      redisInstance = new Redis({ url, token });
    } catch (err) {
      console.warn("Failed to initialize Upstash Redis:", err);
      return null;
    }
  }

  return redisInstance;
}
