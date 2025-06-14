import { IsString, IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type, Transform } from "class-transformer";
import { Decimal } from "@prisma/client/runtime/library";

export class CreateOrderItemDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => parseInt(value))
  quantity: number = 1;

  @Transform(({ value }) => new Decimal(value))
  unitPrice: Decimal;

  @Transform(({ value }) => new Decimal(value))
  totalPrice: Decimal;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateOrderDto {
  @Transform(({ value }) => new Decimal(value))
  amount: Decimal;

  @IsOptional()
  @IsString()
  currencyCode?: string = "IDR";

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems: CreateOrderItemDto[];
}