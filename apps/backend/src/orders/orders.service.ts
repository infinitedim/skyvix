import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateOrderDto, UpdateOrderDto } from "@skyvix/shared";
import { Order, OrderStatus, Prisma } from "@prisma/client";

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async create(createOrderDto: CreateOrderDto & { userId: string }): Promise<Order> {
    return this.prisma.order.create({
      data: {
        ...createOrderDto,
        amount: new Prisma.Decimal(createOrderDto.amount),
        metadata: createOrderDto.metadata as Prisma.InputJsonValue | undefined,
      },
      include: {
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

  async findAll(userId?: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string, userId?: string): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...updateOrderDto };

      if (updateOrderDto.amount) {
        updateData.amount = new Prisma.Decimal(updateOrderDto.amount);
      }

      return await this.prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          payments: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Order not found");
        }
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return this.update(id, { status } as UpdateOrderDto);
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.order.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Order not found");
        }
      }
      throw error;
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.findAll(userId);
  }
}