import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, CreateUserDto } from "@skyvix/shared";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { GetUser } from "./decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { RateLimitAuth, RateLimitAPI } from "../redis/decorators/ratelimit.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post("register")
  @RateLimitAuth(3, 300) // 3 attempts per 5 minutes
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @RateLimitAuth(5, 300) // 5 attempts per 5 minutes
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @RateLimitAPI(10, 60) // 10 requests per minute
  logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Post("refresh")
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @RateLimitAPI(20, 60) // 20 refresh attempts per minute
  refreshTokens(@GetUser() user) {
    return this.authService.refreshTokens(user.sub, user.refreshToken);
  }
}