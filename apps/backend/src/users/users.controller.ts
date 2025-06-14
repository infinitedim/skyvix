/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from "@nestjs/common";
import { ChangePasswordDto, CreateUserDto, UpdateUserDto, UserQueryDto } from "@/users/dto";
import { AuthGuard } from "@/auth/guard/auth.guard";
import { UsersService, UsersGuard } from "@/users";
import { RateLimitInterceptor } from "@/common";

@UseInterceptors(RateLimitInterceptor)
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(UsersGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(UsersGuard)
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get("me")
  async getCurrentUser(@Request() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(":id")
  @UseGuards(UsersGuard)
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Get(":id/stats")
  @UseGuards(UsersGuard)
  async getUserStats(@Param("id") id: string) {
    return this.usersService.getUserStats(id);
  }

  @Patch("me")
  async updateCurrentUser(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Patch(":id")
  @UseGuards(UsersGuard)
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(":id/toggle-status")
  @UseGuards(UsersGuard)
  async toggleStatus(@Param("id") id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req: any, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  @Post(":id/change-password")
  @UseGuards(UsersGuard) 
  @HttpCode(HttpStatus.OK)
  async changeUserPassword(@Param("id") id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Delete(":id")
  @UseGuards(UsersGuard)
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

  @Delete(":id/hard")
  @UseGuards(UsersGuard)
  async hardDelete(@Param("id") id: string) {
    return this.usersService.hardDelete(id);
  }
}