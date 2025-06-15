import { PartialType } from "@nestjs/mapped-types";
import { CreatePaymentDto } from "./create-payment.dto";
import { IsOptional, IsEnum, IsString, IsDateString } from "class-validator";
import { Transform } from "class-transformer";
import { Decimal } from "@prisma/client/runtime/library";
import { PaymentMethod, PaymentStatus } from "@/common/enums";


export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @Transform(({ value }) => new Decimal(value))
  amount?: Decimal;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  externalPaymentId?: string;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  externalResponse?: any;
}