import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { RedisService } from "../redis.service";

interface RateLimitOptions {
  limit: number;
  windowSec: number;
  keyGenerator?: (req: Request) => string;
}

export const RATE_LIMIT_KEY = "rate_limit";

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const identifier = options.keyGenerator
      ? options.keyGenerator(request)
      : this.getDefaultIdentifier(request);

    const result = await this.redisService.checkRateLimit(
      identifier,
      options.limit,
      options.windowSec,
    );

    if (!result.allowed) {
      throw new HttpException(
        {
          message: "Too many requests",
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          remaining: result.remaining,
          resetTime: result.resetTime,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader("X-RateLimit-Limit", options.limit);
    response.setHeader("X-RateLimit-Remaining", result.remaining);
    response.setHeader("X-RateLimit-Reset", result.resetTime);

    return true;
  }

  private getDefaultIdentifier(request: Request): string {
    // Menggunakan kombinasi IP dan user ID jika ada
    const ip = request.ip || request.connection.remoteAddress || "unknown";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (request as any).user?.id;

    return userId ? `user:${userId}` : `ip:${ip}`;
  }
}