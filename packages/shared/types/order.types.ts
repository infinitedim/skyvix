import { OrderStatus } from "./utils.types";

interface CreateOrderDto {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateOrderDto {
  amount?: number;
  currency?: string;
  status?: OrderStatus;
  description?: string;
  metadata?: Record<string, unknown>;
}

export type { CreateOrderDto, UpdateOrderDto, OrderStatus };