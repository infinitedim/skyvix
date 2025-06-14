import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "@/prisma";
import { RedisModule } from "@/redis";
import { AuthModule, AuthService } from "@/auth";
import { UsersModule } from "@/users";
import { RateLimitInterceptor } from "./common";
import { TrainModule } from './train/train.module';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentModule } from './payment/payment.module';

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
    TrainModule,
    PaymentModule,
  ],
  controllers: [AppController, PaymentController],
  providers: [AppService, AuthService, RateLimitInterceptor, PaymentService],
})
export class AppModule { }