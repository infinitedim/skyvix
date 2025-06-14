/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
  Inject
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import { Observable } from "rxjs";

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redisClient: any,
    private readonly limit = 10,
    private readonly ttl = 60,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const key = `rate-limit:${req.ip}:${req.route.path}`;

    const current = await this.redisClient.incr(key);
    if (current === 1) {
      await this.redisClient.expire(key, this.ttl);
    }
    if (current > this.limit) {
      throw new ThrottlerException("Too many requests, please try again later");
    }
    return next.handle();
  }
}