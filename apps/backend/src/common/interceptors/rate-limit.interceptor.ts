/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
  Inject
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Observable } from "rxjs";

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly limit: number;
  private readonly ttl: number;

  constructor(
    @Inject("REDIS_CLIENT") private readonly redisClient: any,
  ) {
    this.limit = 10; // Default limit
    this.ttl = 60;   // Default TTL
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const key = `rate-limit:${req.ip}:${req.route.path}`;

    try {
      const current = await this.redisClient.incr(key);
      if (current === 1) {
        await this.redisClient.expire(key, this.ttl);
      }
      if (current > this.limit) {
        throw new ThrottlerException("Too many requests, please try again later");
      }
    } catch (error) {
      // If Redis is not available, allow the request to continue
      console.warn("Rate limiting failed:", error.message);
    }

    return next.handle();
  }
}