import { Controller, Get, Post, Body, Param, Delete, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "@skyvix/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "./entities/user.entity";
import { RateLimitUser, RateLimitAPI } from "../redis/decorators/ratelimit.decorator";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @RateLimitAPI(5, 60) // 5 user creations per minute
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RateLimitAPI(50, 60) // 50 requests per minute
  findAll() {
    return this.usersService.findAll();
  }

  @Get("profile")
  @RateLimitUser(100, 60) // 100 profile requests per minute per user
  getProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get(":id")
  @RateLimitAPI(30, 60) // 30 requests per minute
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Delete(":id")
  @RateLimitAPI(5, 60) // 5 deletions per minute
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}