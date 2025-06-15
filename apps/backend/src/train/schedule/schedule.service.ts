/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma";
import { CreateScheduleDto } from "@/train/dto/create-schedule.dto";

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async createSchedule(createScheduleDto: CreateScheduleDto) {
    const route = await this.prisma.trainRoute.findUnique({
      where: { id: createScheduleDto.routeId },
      include: { train: true },
    });

    if (!route) {
      throw new NotFoundException("Route not found");
    }

    const schedule = await this.prisma.trainSchedule.create({
      data: {
        ...createScheduleDto,
        trainId: route.trainId,
        validFrom: new Date(createScheduleDto.validFrom),
        validUntil: new Date(createScheduleDto.validUntil),
      },
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

    return schedule;
  }

  async findAllSchedules(query?: {
    routeId?: string;
    trainId?: string;
    departureStationId?: string;
    arrivalStationId?: string;
    date?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      routeId,
      trainId,
      departureStationId,
      arrivalStationId,
      date,
      isActive,
      page = 1,
      limit = 10,
    } = query || {};

    const where: any = {};

    if (routeId) where.routeId = routeId;
    if (trainId) where.trainId = trainId;
    if (isActive !== undefined) where.isActive = isActive;

    if (date) {
      const searchDate = new Date(date);
      where.validFrom = { lte: searchDate };
      where.validUntil = { gte: searchDate };
    }

    if (departureStationId || arrivalStationId) {
      where.route = {};
      if (departureStationId) where.route.departureStationId = departureStationId;
      if (arrivalStationId) where.route.arrivalStationId = arrivalStationId;
    }

    const [schedules, total] = await Promise.all([
      this.prisma.trainSchedule.findMany({
        where,
        include: {
          route: {
            include: {
              train: true,
              departureStation: true,
              arrivalStation: true,
            },
          },
          seats: {
            where: { isAvailable: true },
            orderBy: [{ carNumber: "asc" }, { seatNumber: "asc" }],
          },
          _count: {
            select: {
              seats: true,
              bookings: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ validFrom: "asc" }, { departureTime: "asc" }],
      }),
      this.prisma.trainSchedule.count({ where }),
    ]);

    return {
      data: schedules,
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

  async findScheduleById(id: string) {
    const schedule = await this.prisma.trainSchedule.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            train: true,
            departureStation: true,
            arrivalStation: true,
          },
        },
        seats: {
          orderBy: [{ carNumber: "asc" }, { seatNumber: "asc" }],
        },
        bookings: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            seat: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async updateSchedule(id: string, updateData: Partial<CreateScheduleDto>) {
    await this.findScheduleById(id);

    const data: any = { ...updateData };
    if (updateData.validFrom) data.validFrom = new Date(updateData.validFrom);
    if (updateData.validUntil) data.validUntil = new Date(updateData.validUntil);

    return this.prisma.trainSchedule.update({
      where: { id },
      data,
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
  }

  async deleteSchedule(id: string) {
    await this.findScheduleById(id);

    // Check for active bookings
    const activeBookings = await this.prisma.trainBooking.count({
      where: {
        scheduleId: id,
        status: {
          in: ["PENDING", "CONFIRMED", "PAID"],
        },
      },
    });

    if (activeBookings > 0) {
      throw new ConflictException("Cannot delete schedule with active bookings");
    }

    return this.prisma.trainSchedule.delete({
      where: { id },
    });
  }

  async searchSchedules(query: {
    departureStationId: string;
    arrivalStationId: string;
    departureDate: string;
    trainType?: string;
    seatClass?: string;
  }) {
    const { departureStationId, arrivalStationId, departureDate, trainType } = query;

    const searchDate = new Date(departureDate);
    const dayOfWeek = searchDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

    const where: any = {
      isActive: true,
      validFrom: { lte: searchDate },
      validUntil: { gte: searchDate },
      operatingDays: {
        has: dayOfWeek,
      },
      route: {
        isActive: true,
        departureStationId,
        arrivalStationId,
        ...(trainType && {
          train: {
            type: trainType,
          },
        }),
      },
    };

    return this.prisma.trainSchedule.findMany({
      where,
      include: {
        route: {
          include: {
            train: true,
            departureStation: true,
            arrivalStation: true,
          },
        },
        seats: {
          where: {
            isAvailable: true,
            ...(query.seatClass && { seatClass: query.seatClass as any }),
          },
          orderBy: [{ seatClass: "asc" }, { carNumber: "asc" }, { seatNumber: "asc" }],
        },
      },
      orderBy: { departureTime: "asc" },
    });
  }
}