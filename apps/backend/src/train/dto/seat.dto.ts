import { IsString, IsEnum, IsBoolean, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { SeatClass } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export class CreateSeatDto {
  @IsString()
  scheduleId: string;

  @IsString()
  trainId: string;

  @IsString()
  carNumber: string;

  @IsString()
  seatNumber: string;

  @IsEnum(SeatClass)
  seatClass: SeatClass;

  @Transform(({ value }) => new Decimal(value))
  price: Decimal;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;
}