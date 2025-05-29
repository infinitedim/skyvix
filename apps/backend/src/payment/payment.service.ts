import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { Payment, PaymentStatus, Prisma } from "@prisma/client";
import { Xendit } from "xendit-node";
import { CreatePaymentDto, UpdatePaymentDto, XenditWebhookDto } from "@skyvix/shared";

@Injectable()
export class PaymentService {
  private xendit: Xendit;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.xendit = new Xendit({
      secretKey: this.configService.get<string>("XENDIT_SECRET_KEY") || "",
    });
  }

  async create(createPaymentDto: CreatePaymentDto, userId: string): Promise<Payment> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: createPaymentDto.orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        userId,
        amount: new Prisma.Decimal(createPaymentDto.amount),
      },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async createXenditInvoice(createPaymentDto: CreatePaymentDto, userId: string) {
    const payment = await this.create(createPaymentDto, userId);

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException("User not found");
      }

      const invoiceParams = {
        externalId: payment.id,
        amount: Number(payment.amount),
        payerEmail: user.email,
        description: createPaymentDto.description || `Payment for Order ${payment.orderId}`,
        currency: payment.currency,
        successRedirectUrl: `${this.configService.get("FRONTEND_URL")}/payment/success`,
        failureRedirectUrl: `${this.configService.get("FRONTEND_URL")}/payment/failed`,
      };

      const invoice = await this.xendit.Invoice.createInvoice({ data: invoiceParams });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          xenditPaymentId: invoice.id,
          xenditResponse: JSON.parse(JSON.stringify(invoice)),
        },
      });

      return {
        payment,
        invoice,
        paymentUrl: invoice.invoiceUrl,
      };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: error.message,
        },
      });
      throw error;
    }
  }

  async handleXenditWebhook(webhookData: XenditWebhookDto, callbackToken: string) {
    const expectedToken = this.configService.get<string>("XENDIT_WEBHOOK_TOKEN");
    if (callbackToken !== expectedToken) {
      throw new UnauthorizedException("Invalid webhook token");
    }

    const externalId = webhookData.external_id;
    const payment = await this.prisma.payment.findFirst({
      where: { id: externalId },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    let status: PaymentStatus = "PENDING";
    let paidAt: Date | null = null;

    switch (webhookData.status) {
      case "PAID":
      case "SETTLED":
        status = "PAID";
        paidAt = new Date();
        break;
      case "FAILED":
      case "EXPIRED":
        status = "FAILED";
        break;
      case "PENDING":
        status = "PENDING";
        break;
      default:
        status = "PROCESSING";
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        paidAt,
        xenditResponse: webhookData as unknown as Prisma.InputJsonValue,
      },
    });

    if (status === "PAID") {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "COMPLETED" },
      });
    }

    return { success: true };
  }

  async findAll(userId: string, status?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAdmin(status?: string, page = 1, limit = 10, userId?: string) {
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return payment;
  }

  async checkPaymentStatus(id: string, userId: string) {
    const payment = await this.findOne(id, userId);

    if (!payment.xenditPaymentId) {
      return { payment, xenditStatus: null };
    }

    try {
      let xenditPayment;

      // Check different payment types
      if (payment.paymentMethod === "INVOICE") {
        xenditPayment = await this.xendit.Invoice.getInvoiceById({
          invoiceId: payment.xenditPaymentId,
        });
      } else if (payment.paymentMethod && ["BCA", "BNI", "BRI", "MANDIRI"].includes(payment.paymentMethod)) {
        xenditPayment = await this.xendit.PaymentMethod.getAllPaymentMethods({
          type: [payment.paymentMethod],
        });
      }

      return { payment, xenditStatus: xenditPayment };
    } catch (error) {
      return { payment, xenditStatus: null, error: error.message };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, updatePaymentDto: UpdatePaymentDto, userId: string): Promise<Payment> {


    const updateData: Record<string, unknown> = { ...updatePaymentDto };
    if (updatePaymentDto.amount) {
      updateData.amount = new Prisma.Decimal(updatePaymentDto.amount);
    }

    return this.prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async cancelPayment(id: string, userId: string) {
    const payment = await this.findOne(id, userId);

    if (payment.status === "PAID") {
      throw new BadRequestException("Cannot cancel paid payment");
    }

    return this.prisma.payment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async refundPayment(id: string, userId: string, reason?: string) {
    const payment = await this.findOne(id, userId);

    if (payment.status !== "PAID") {
      throw new BadRequestException("Can only refund paid payments");
    }

    // TODO: Implement actual refund logic with Xendit
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: "REFUNDED",
        failureReason: reason,
      },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async retryPayment(id: string, userId: string) {
    const payment = await this.findOne(id, userId);

    if (payment.status === "PAID") {
      throw new BadRequestException("Payment already paid");
    }

    // Reset payment status to pending for retry
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: "PENDING",
        failureReason: null,
      },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const payment = await this.findOne(id, userId);

    if (payment.status === "PAID") {
      throw new BadRequestException("Cannot delete paid payment");
    }

    await this.prisma.payment.delete({
      where: { id },
    });
  }

  async getPaymentsByOrder(orderId: string, userId: string) {
    return this.prisma.payment.findMany({
      where: {
        orderId,
        userId,
      },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPaymentStatistics(userId: string) {
    const [totalPayments, paidPayments, pendingPayments, failedPayments, totalAmount] = await Promise.all([
      this.prisma.payment.count({ where: { userId } }),
      this.prisma.payment.count({ where: { userId, status: "PAID" } }),
      this.prisma.payment.count({ where: { userId, status: "PENDING" } }),
      this.prisma.payment.count({ where: { userId, status: "FAILED" } }),
      this.prisma.payment.aggregate({
        where: { userId, status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }

  async getAdminPaymentStatistics() {
    const [totalPayments, paidPayments, pendingPayments, failedPayments, totalAmount] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: "PAID" } }),
      this.prisma.payment.count({ where: { status: "PENDING" } }),
      this.prisma.payment.count({ where: { status: "FAILED" } }),
      this.prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount._sum.amount || 0,
    };
  }
}