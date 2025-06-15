import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersGuard } from "./guard/users.guard";
import { AuthModule } from "@/auth";

Global();
@Module({
  imports: [PrismaModule, AuthModule],
  providers: [UsersService, UsersGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}