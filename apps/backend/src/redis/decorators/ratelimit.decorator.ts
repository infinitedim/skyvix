import { SetMetadata } from "@nestjs/common";
import { Request } from "express";
import { RATE_LIMIT_KEY } from "../constant/constant";

export interface RateLimitOptions {
  limit: number;
  windowSec: number;
  keyGenerator?: (req: Request) => string;
}

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

export const RateLimitPerIpAndEndpoint = (limit = 10, windowSec = 60) =>
  RateLimit({
    limit,
    windowSec,
    keyGenerator: (req: Request) => {
      const ip = req.ip || req.connection.remoteAddress || "unknown";
      return `rl:${req.path}:ip:${ip}`;
    }
  });