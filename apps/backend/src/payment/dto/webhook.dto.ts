import { IsString, IsOptional, IsNumber, IsDateString } from "class-validator";

export class XenditWebhookDto {
  @IsString()
  id: string;

  @IsString()
  external_id: string;

  @IsString()
  user_id: string;

  @IsString()
  status: string;

  @IsString()
  merchant_name: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  paid_amount?: number;

  @IsOptional()
  @IsString()
  bank_code?: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @IsOptional()
  @IsString()
  payer_email?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  adjusted_received_amount?: number;

  @IsOptional()
  @IsNumber()
  fees_paid_amount?: number;

  @IsOptional()
  @IsDateString()
  updated?: string;

  @IsOptional()
  @IsDateString()
  created?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsString()
  payment_id?: string;

  @IsOptional()
  payment_detail?: Record<string, unknown>;
}

export class PaymentCallbackDto {
  @IsString()
  paymentId: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}