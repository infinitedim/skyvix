import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "@/auth";
import { GuardsModule } from "@/common/guard/guard.module";
import { RateLimitInterceptor } from "@/common";
import { PaymentController, PaymentModule, PaymentService } from "@/payment";
import { PrismaModule } from "@/prisma";
import { RedisModule } from "@/redis";
import { TrainModule } from "@/train";
import { UsersModule } from "@/users";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.development", ".env"],
    }),
    PrismaModule,
    RedisModule,
    GuardsModule, // Add GuardsModule first
    AuthModule,
    UsersModule,
    TrainModule,
    PaymentModule,
  ],
  controllers: [AppController, PaymentController],
  providers: [AppService, RateLimitInterceptor, PaymentService],
})
export class AppModule {}