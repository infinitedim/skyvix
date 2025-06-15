import { IsString, IsOptional, IsBoolean, IsEnum } from "class-validator";
import { TrainType } from "@prisma/client";

export class CreateTrainDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(TrainType)
  type: TrainType;

  @IsOptional()
  facilities?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateTrainDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TrainType)
  type?: TrainType;

  @IsOptional()
  facilities?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}