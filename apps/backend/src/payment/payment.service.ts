/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { PaymentQueryDto } from "./dto/payment-query.dto";
import { XenditWebhookDto } from "./dto/webhook.dto";
import { Decimal } from "@prisma/client/runtime/library";
import { PaymentMethod, PaymentStatus, OrderStatus } from "@/common/enums";

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPayment(createPaymentDto: CreatePaymentDto) {
    const { orderId, ...paymentData } = createPaymentDto;

    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Check if payment already exists for this order
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId },
    });

    if (existingPayment) {
      throw new BadRequestException("Payment already exists for this order");
    }

    // Generate payment reference
    const paymentReference = this.generatePaymentReference();

    try {
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          externalPaymentId: paymentReference,
          status: PaymentStatus.PENDING as any,
          ...paymentData,
          paymentMethod: paymentData.paymentMethod as any,
        } as any,
        include: {
          order: {
            include: {
              orderItems: true,
            },
          },
        },
      });

      this.logger.log(`Payment created: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`);
      throw new BadRequestException("Failed to create payment");
    }
  }

  async findAllPayments(query: PaymentQueryDto) {
    const {
      search,
      orderId,
      status,
      paymentMethod,
      currencyCode,
      startDate,
      endDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    if(page === undefined || limit === undefined) {
      throw new BadRequestException("Page and limit must be defined");
    }

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentReference: { contains: search, mode: "insensitive" } },
        { payerName: { contains: search, mode: "insensitive" } },
        { payerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (currencyCode) where.currencyCode = currencyCode;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy || "createdAt"]: sortOrder },
        include: {
          order: {
            include: {
              orderItems: true,
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPaymentById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return payment;
  }

  async findPaymentByReference(paymentReference: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { externalPaymentId: paymentReference },
      include: {
        order: {
          include: {
            orderItems: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return payment;
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto) {
    const existingPayment = await this.findPaymentById(id);

    const { ...updateData } = updatePaymentDto;

    try {
      const payment = await this.prisma.payment.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        } as any,
        include: {
          order: {
            include: {
              orderItems: true,
            },
          },
        },
      });

      // Update order status if payment is completed
      if (updatePaymentDto.status === PaymentStatus.COMPLETED) {
        await this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.COMPLETED },
        });
      }

      this.logger.log(`Payment updated: ${payment.id}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to update payment: ${error.message}`);
      throw new BadRequestException("Failed to update payment");
    }
  }

  async deletePayment(id: string) {
    const existingPayment = await this.findPaymentById(id);

    if (existingPayment.status === PaymentStatus.COMPLETED.toString()) {
      throw new BadRequestException("Cannot delete completed payment");
    }

    try {
      await this.prisma.payment.delete({
        where: { id },
      });

      this.logger.log(`Payment deleted: ${id}`);
      return { message: "Payment deleted successfully" };
    } catch (error) {
      this.logger.error(`Failed to delete payment: ${error.message}`);
      throw new BadRequestException("Failed to delete payment");
    }
  }

  async processWebhook(webhookData: XenditWebhookDto) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { externalPaymentId: webhookData.external_id },
      });

      if (!payment) {
        this.logger.warn(`Payment not found for external ID: ${webhookData.external_id}`);
        return { message: "Payment not found" };
      }

      const status = this.mapExternalStatus(webhookData.status);
      
      await this.updatePayment(payment.id, {
        status,
        externalResponse: webhookData,
        paidAt: webhookData.paid_at,
      });

      this.logger.log(`Webhook processed for payment: ${payment.id}`);
      return { message: "Webhook processed successfully" };
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`);
      throw new BadRequestException("Failed to process webhook");
    }
  }

  async getPaymentStats(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
    ] = await Promise.all([
      this.prisma.payment.count({ where }),
      this.prisma.payment.count({ where: { ...where, status: PaymentStatus.COMPLETED } }),
      this.prisma.payment.count({ where: { ...where, status: PaymentStatus.PENDING } }),
      this.prisma.payment.count({ where: { ...where, status: PaymentStatus.FAILED } }),
      this.prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount._sum.amount || new Decimal(0),
      successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
    };
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  private mapExternalStatus(externalStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      "PAID": PaymentStatus.COMPLETED,
      "SETTLED": PaymentStatus.COMPLETED,
      "PENDING": PaymentStatus.PENDING,
      "EXPIRED": PaymentStatus.EXPIRED,
      "FAILED": PaymentStatus.FAILED,
    };

    return statusMap[externalStatus.toUpperCase()] || PaymentStatus.PENDING;
  }
}