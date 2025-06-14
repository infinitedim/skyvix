import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersGuard } from "./guard/users.guard";

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}