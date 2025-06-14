import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";
import { Transform } from "class-transformer";

export class CreateStationDto {
  @IsString()
  code: string; // Max 10 chars

  @IsString()
  name: string;

  @IsString()
  city: string;

  @IsString()
  province: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}