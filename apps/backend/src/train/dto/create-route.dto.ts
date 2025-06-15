import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

export class CreateRouteDto {
  @IsString()
  trainId: string;

  @IsString()
  departureStationId: string;

  @IsString()
  arrivalStationId: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  distance?: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  estimatedDuration: number; // in minutes

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}