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
import { StationService } from "./station.service";
import { CreateStationDto } from "@/train/dto/create-station.dto";
import { AuthGuard } from "@/auth/guard/auth.guard";

@Controller("stations")
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() createStationDto: CreateStationDto) {
    return this.stationService.createStation(createStationDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.stationService.findAllStations(query);
  }

  @Get("by-city")
  getByCity() {
    return this.stationService.getStationsByCity();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.stationService.findStationById(id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(@Param("id") id: string, @Body() updateData: Partial<CreateStationDto>) {
    return this.stationService.updateStation(id, updateData);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  remove(@Param("id") id: string) {
    return this.stationService.deleteStation(id);
  }
}