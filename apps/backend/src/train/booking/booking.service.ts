/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma";
import { CreateBookingDto } from "../dto/create-booking.dto";
import { BookingStatus } from "@prisma/client";

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(userId: string, createBookingDto: CreateBookingDto) {
    const { scheduleId, seatId, departureDate, ...bookingData } = createBookingDto;

    const schedule = await this.prisma.trainSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: {
          include: {
            train: true,
            departureStation: true,
            arrivalStation: true,
          },
        },
      },
    });

    if (!schedule || !schedule.isActive) {
      throw new NotFoundException("Schedule not found or inactive");
    }

    // Validate seat if provided
    let seat: any = null;
    if (seatId) {
      seat = await this.prisma.trainSeat.findUnique({
        where: { id: seatId },
      });

      if (!seat || !seat.isAvailable || seat.scheduleId !== scheduleId) {
        throw new BadRequestException("Seat not available");
      }
    }

    // Generate booking code
    const bookingCode = await this.generateBookingCode();

    return this.prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.trainBooking.create({
        data: {
          userId,
          scheduleId,
          seatId,
          bookingCode,
          departureDate: new Date(departureDate),
          ...bookingData,
        },
        include: {
          schedule: {
            include: {
              route: {
                include: {
                  train: true,
                  departureStation: true,
                  arrivalStation: true,
                },
              },
            },
          },
          seat: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      // Mark seat as unavailable if selected
      if (seatId) {
        await tx.trainSeat.update({
          where: { id: seatId },
          data: { isAvailable: false },
        });
      }

      return booking;
    });
  }

  async findUserBookings(userId: string, query?: {
    status?: BookingStatus;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 10 } = query || {};

    const where: any = { userId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      this.prisma.trainBooking.findMany({
        where,
        include: {
          schedule: {
            include: {
              route: {
                include: {
                  train: true,
                  departureStation: true,
                  arrivalStation: true,
                },
              },
            },
          },
          seat: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.trainBooking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findAllBookings(query?: {
    status?: BookingStatus;
    scheduleId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, scheduleId, userId, page = 1, limit = 10 } = query || {};

    const where: any = {};
    if (status) where.status = status;
    if (scheduleId) where.scheduleId = scheduleId;
    if (userId) where.userId = userId;

    const [bookings, total] = await Promise.all([
      this.prisma.trainBooking.findMany({
        where,
        include: {
          schedule: {
            include: {
              route: {
                include: {
                  train: true,
                  departureStation: true,
                  arrivalStation: true,
                },
              },
            },
          },
          seat: true,
          user: {
            include: {
              profile: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.trainBooking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async findBookingById(id: string) {
    const booking = await this.prisma.trainBooking.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                train: true,
                departureStation: true,
                arrivalStation: true,
              },
            },
          },
        },
        seat: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findBookingByCode(bookingCode: string) {
    const booking = await this.prisma.trainBooking.findUnique({
      where: { bookingCode },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                train: true,
                departureStation: true,
                arrivalStation: true,
              },
            },
          },
        },
        seat: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with code ${bookingCode} not found`);
    }

    return booking;
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const booking = await this.findBookingById(id);

    const updateData: any = { status };
    if (status === BookingStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
    }

    const updatedBooking = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.trainBooking.update({
        where: { id },
        data: updateData,
        include: {
          schedule: {
            include: {
              route: {
                include: {
                  train: true,
                  departureStation: true,
                  arrivalStation: true,
                },
              },
            },
          },
          seat: true,
        },
      });

      // Release seat if booking is cancelled
      if (status === BookingStatus.CANCELLED && booking.seatId) {
        await tx.trainSeat.update({
          where: { id: booking.seatId },
          data: { isAvailable: true },
        });
      }

      return updated;
    });

    return updatedBooking;
  }

  async cancelBooking(id: string, userId?: string) {
    const booking = await this.findBookingById(id);

    if (userId && booking.userId !== userId) {
      throw new BadRequestException("You can only cancel your own bookings");
    }

    if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException("Only pending or confirmed bookings can be cancelled");
    }

    return this.updateBookingStatus(id, BookingStatus.CANCELLED);
  }

  private async generateBookingCode(): Promise<string> {
    const prefix = "BK";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}