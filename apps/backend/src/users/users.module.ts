import { Module } from "@nestjs/common";
import { UsersController, UsersGuard, UsersService } from "@/users";
import { PrismaModule } from "@/prisma";

@Module({
  imports: [PrismaModule],
  providers: [UsersService, UsersGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
