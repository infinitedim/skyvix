/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma";
import { CreateTrainDto, UpdateTrainDto } from "./dto/create-train.dto";
import { CreateRouteDto } from "./dto/create-route.dto";
import { TrainType } from "@prisma/client";

@Injectable()
export class TrainService {
  constructor(private prisma: PrismaService) {}

  // Train CRUD
  async createTrain(createTrainDto: CreateTrainDto) {
    const existingTrain = await this.prisma.train.findUnique({
      where: { code: createTrainDto.code },
    });

    if (existingTrain) {
      throw new ConflictException(`Train with code ${createTrainDto.code} already exists`);
    }

    return this.prisma.train.create({
      data: {
        ...createTrainDto,
        facilities: createTrainDto.facilities as any,
      },
      include: {
        routes: {
          include: {
            departureStation: true,
            arrivalStation: true,
          },
        },
        schedules: true,
      },
    });
  }

  async findAllTrains(query?: {
    search?: string;
    type?: TrainType;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      type,
      isActive,
      page = 1,
      limit = 10,
    } = query || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [trains, total] = await Promise.all([
      this.prisma.train.findMany({
        where,
        include: {
          routes: {
            include: {
              departureStation: true,
              arrivalStation: true,
            },
          },
          _count: {
            select: {
              routes: true,
              schedules: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.train.count({ where }),
    ]);

    return {
      data: trains,
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

  async findTrainById(id: string) {
    const train = await this.prisma.train.findUnique({
      where: { id },
      include: {
        routes: {
          include: {
            departureStation: true,
            arrivalStation: true,
            schedules: true,
          },
        },
        schedules: {
          include: {
            route: {
              include: {
                departureStation: true,
                arrivalStation: true,
              },
            },
            seats: true,
          },
        },
        TrainSeat: {
          include: {
            schedule: true,
          },
        },
      },
    });

    if (!train) {
      throw new NotFoundException(`Train with ID ${id} not found`);
    }

    return train;
  }

  async updateTrain(id: string, updateTrainDto: UpdateTrainDto) {
    await this.findTrainById(id);

    return this.prisma.train.update({
      where: { id },
      data: {
        ...updateTrainDto,
        facilities: updateTrainDto.facilities as any,
      },
      include: {
        routes: {
          include: {
            departureStation: true,
            arrivalStation: true,
          },
        },
      },
    });
  }

  async deleteTrain(id: string) {
    await this.findTrainById(id);

    // Check if train has active bookings
    const activeBookings = await this.prisma.trainBooking.count({
      where: {
        schedule: {
          route: {
            trainId: id,
          },
        },
        status: {
          in: ["PENDING", "CONFIRMED", "PAID"],
        },
      },
    });

    if (activeBookings > 0) {
      throw new ConflictException("Cannot delete train with active bookings");
    }

    return this.prisma.train.delete({
      where: { id },
    });
  }

  // Route Management
  async createRoute(createRouteDto: CreateRouteDto) {
    // Check if route already exists
    const existingRoute = await this.prisma.trainRoute.findUnique({
      where: {
        trainId_departureStationId_arrivalStationId: {
          trainId: createRouteDto.trainId,
          departureStationId: createRouteDto.departureStationId,
          arrivalStationId: createRouteDto.arrivalStationId,
        },
      },
    });

    if (existingRoute) {
      throw new ConflictException("Route already exists for this train");
    }

    return this.prisma.trainRoute.create({
      data: createRouteDto,
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
    });
  }

  async findRoutesByTrain(trainId: string) {
    return this.prisma.trainRoute.findMany({
      where: { trainId },
      include: {
        departureStation: true,
        arrivalStation: true,
        schedules: {
          where: { isActive: true },
          include: {
            seats: true,
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        },
      },
    });
  }

  async searchTrains(query: {
    departureStationId?: string;
    arrivalStationId?: string;
    departureDate?: string;
    trainType?: TrainType;
    seatClass?: string;
  }) {
    const {
      departureStationId,
      arrivalStationId,
      departureDate,
      trainType,
    } = query;

    const where: any = {
      isActive: true,
      routes: {
        some: {
          isActive: true,
          ...(departureStationId && { departureStationId }),
          ...(arrivalStationId && { arrivalStationId }),
        },
      },
    };

    if (trainType) where.type = trainType;

    return this.prisma.train.findMany({
      where,
      include: {
        routes: {
          where: {
            isActive: true,
            ...(departureStationId && { departureStationId }),
            ...(arrivalStationId && { arrivalStationId }),
          },
          include: {
            departureStation: true,
            arrivalStation: true,
            schedules: {
              where: {
                isActive: true,
                ...(departureDate && {
                  validFrom: { lte: new Date(departureDate) },
                  validUntil: { gte: new Date(departureDate) },
                }),
              },
              include: {
                seats: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
    });
  }
}