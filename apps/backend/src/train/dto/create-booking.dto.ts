import { IsString, IsEmail, IsDateString, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { Decimal } from "@prisma/client/runtime/library";

export class CreateBookingDto {
  @IsString()
  scheduleId: string;

  @IsOptional()
  @IsString()
  seatId?: string;

  @IsString()
  passengerName: string;

  @IsString()
  passengerIdCard: string;

  @IsString()
  passengerPhone: string;

  @IsEmail()
  passengerEmail: string;

  @IsDateString()
  departureDate: string;

  @Transform(({ value }) => new Decimal(value))
  totalPrice: Decimal;
}