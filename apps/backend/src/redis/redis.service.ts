import { Injectable, Inject } from "@nestjs/common";
import { Redis } from "ioredis";

@Injectable()
export class RedisService {
  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) { }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    return this.redis.expire(key, ttl);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async checkRateLimit(identifier: string, limit: number, windowSec: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `rate_limit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - windowSec;

    const pipeline = this.redis.pipeline();

    pipeline.zremrangebyscore(key, "-inf", windowStart);

    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    pipeline.expire(key, windowSec);

    const results = await pipeline.exec();
    const currentCount = results?.[1]?.[1] as number || 0;
    const newCount = currentCount + 1;

    const allowed = newCount <= limit;
    const remaining = Math.max(0, limit - newCount);
    const resetTime = now + windowSec;

    return {
      allowed,
      remaining,
      resetTime,
    };
  }
}