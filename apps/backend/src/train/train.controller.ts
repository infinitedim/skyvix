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
  UseInterceptors,
} from "@nestjs/common";
import { TrainService } from "./train.service";
import { CreateTrainDto, UpdateTrainDto } from "./dto/create-train.dto";
import { CreateRouteDto } from "./dto/create-route.dto";
import { AuthGuard } from "@/auth/guard/auth.guard";
import { RateLimitInterceptor } from "@/common";

@UseInterceptors(RateLimitInterceptor)
@Controller("train")
@UseGuards(AuthGuard)
export class TrainController {
  constructor(private readonly trainService: TrainService) {}

  @Post()
  create(@Body() createTrainDto: CreateTrainDto) {
    return this.trainService.createTrain(createTrainDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.trainService.findAllTrains(query);
  }

  @Get("search")
  search(@Query() query: any) {
    return this.trainService.searchTrains(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.trainService.findTrainById(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTrainDto: UpdateTrainDto) {
    return this.trainService.updateTrain(id, updateTrainDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.trainService.deleteTrain(id);
  }

  @Post("routes")
  createRoute(@Body() createRouteDto: CreateRouteDto) {
    return this.trainService.createRoute(createRouteDto);
  }

  @Get(":id/routes")
  getRoutes(@Param("id") trainId: string) {
    return this.trainService.findRoutesByTrain(trainId);
  }
}