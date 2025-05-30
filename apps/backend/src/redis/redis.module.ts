import { Module, Global } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "REDIS_CLIENT",
      useFactory: async (configService: ConfigService) => {
        const Redis = (await import("ioredis")).default;
        const redisUrl = configService.get<string>("REDIS_URL") || configService.get<string>("REDIS_HOST", "redis://localhost:6379");

        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        redis.on("connect", () => {
          console.log("✅ Redis connected successfully");
        });

        redis.on("error", (err) => {
          console.error("❌ Redis connection error:", err);
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule { }