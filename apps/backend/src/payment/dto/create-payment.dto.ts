import { IsString, IsOptional, IsEnum, IsEmail, IsUUID } from "class-validator";
import { Transform } from "class-transformer";
import { Decimal } from "@prisma/client/runtime/library";
import { PaymentMethod } from "@/common/enums";

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @Transform(({ value }) => new Decimal(value))
  amount: Decimal;

  @IsOptional()
  @IsString()
  currencyCode?: string = "IDR";

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @IsOptional()
  @IsString()
  payerPhone?: string;

  @IsOptional()
  @IsString()
  payerName?: string;

  @IsOptional()
  @IsString()
  externalPaymentId?: string;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  externalResponse?: any;

  @IsOptional()
  metadata?: Record<string, unknown>;
}