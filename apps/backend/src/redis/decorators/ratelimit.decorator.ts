import { SetMetadata } from "@nestjs/common";
import { Request } from "express";

interface RateLimitOptions {
  limit: number;
  windowSec: number;
  keyGenerator?: (req: Request) => string;
}

export const RATE_LIMIT_KEY = "rate_limit";

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

// Preset decorators untuk kemudahan
export const RateLimitAPI = (limit: number = 100, windowSec: number = 60) =>
  RateLimit({ limit, windowSec });

export const RateLimitAuth = (limit: number = 5, windowSec: number = 60) =>
  RateLimit({
    limit,
    windowSec,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      return `auth:${ip}`;
    }
  });

export const RateLimitUser = (limit: number = 1000, windowSec: number = 3600) =>
  RateLimit({
    limit,
    windowSec,
    keyGenerator: (req: Request) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : `ip:${req.ip}`;
    }
  });