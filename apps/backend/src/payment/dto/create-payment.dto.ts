import { IsString, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { Decimal } from "@prisma/client/runtime/library";

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @Transform(({ value }) => new Decimal(value))
  amount: Decimal;

  @IsOptional()
  @IsString()
  currencyCode?: string = "IDR";

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  externalPaymentId?: string;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  externalResponse?: any;
}