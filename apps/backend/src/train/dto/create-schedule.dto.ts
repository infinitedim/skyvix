import { IsString, IsDateString, IsArray, IsBoolean, IsOptional } from "class-validator";

export class CreateScheduleDto {
  @IsString()
  routeId: string;

  @IsString()
  departureTime: string; // Format: "HH:mm"

  @IsString()
  arrivalTime: string; // Format: "HH:mm"

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsArray()
  @IsString({ each: true })
  operatingDays: string[]; // ["MONDAY", "TUESDAY", etc.]

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}