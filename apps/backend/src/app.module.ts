import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "@/prisma";
import { RedisModule } from "@/redis";
import { AuthModule, AuthService } from "@/auth";
import { UsersModule } from "@/users";
import { RateLimitInterceptor } from "./common";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.development", ".env"],
    }),
    PrismaModule,
    RedisModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuthService, RateLimitInterceptor],
})
export class AppModule { }