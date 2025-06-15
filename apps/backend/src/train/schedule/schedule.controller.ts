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
} from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import { CreateScheduleDto } from "@/train/dto/create-schedule.dto";
import { AuthGuard } from "@/auth/guard/auth.guard";

@Controller("schedules")
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.createSchedule(createScheduleDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.scheduleService.findAllSchedules(query);
  }

  @Get("search")
  search(@Query() query: any) {
    return this.scheduleService.searchSchedules(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.scheduleService.findScheduleById(id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(@Param("id") id: string, @Body() updateData: Partial<CreateScheduleDto>) {
    return this.scheduleService.updateSchedule(id, updateData);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  remove(@Param("id") id: string) {
    return this.scheduleService.deleteSchedule(id);
  }
}