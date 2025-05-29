import { PaymentStatus } from "./utils.types";

interface PaymentInvoice {
  id: string;
  externalId: string;
  amount: number;
  description: string;
  status: PaymentStatus;
  invoiceUrl: string;
  payerEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateInvoiceDto {
  amount: number;
  description: string;
  externalId: string;
  payerEmail?: string;
}

interface CreatePaymentDto {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  description?: string;
  phoneNumber?: string;
}

interface UpdatePaymentDto {
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  paymentMethod?: string;
  failureReason?: string;
}

interface XenditWebhookDto {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  paid_amount?: number;
  bank_code?: string;
  paid_at?: string;
  payer_email?: string;
  description?: string;
  adjusted_received_amount?: number;
  fees_paid_amount?: number;
  updated?: string;
  created?: string;
  currency?: string;
  payment_method?: string;
  payment_id?: string;
  payment_detail?: Record<string, unknown>;
}

export type { PaymentInvoice, CreateInvoiceDto, CreatePaymentDto, UpdatePaymentDto, XenditWebhookDto };