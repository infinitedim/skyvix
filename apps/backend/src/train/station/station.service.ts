/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "@/prisma";
import { CreateStationDto } from "../dto/create-station.dto";

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  async createStation(createStationDto: CreateStationDto) {
    const existingStation = await this.prisma.station.findUnique({
      where: { code: createStationDto.code },
    });

    if (existingStation) {
      throw new ConflictException(`Station with code ${createStationDto.code} already exists`);
    }

    return this.prisma.station.create({
      data: createStationDto,
    });
  }

  async findAllStations(query?: {
    search?: string;
    city?: string;
    province?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      city,
      province,
      isActive,
      page = 1,
      limit = 10,
    } = query || {};

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (city) where.city = { contains: city, mode: "insensitive" };
    if (province) where.province = { contains: province, mode: "insensitive" };
    if (isActive !== undefined) where.isActive = isActive;

    const [stations, total] = await Promise.all([
      this.prisma.station.findMany({
        where,
        include: {
          _count: {
            select: {
              departureRoutes: true,
              arrivalRoutes: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ province: "asc" }, { city: "asc" }, { name: "asc" }],
      }),
      this.prisma.station.count({ where }),
    ]);

    return {
      data: stations,
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

  async findStationById(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        departureRoutes: {
          include: {
            train: true,
            arrivalStation: true,
          },
        },
        arrivalRoutes: {
          include: {
            train: true,
            departureStation: true,
          },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    return station;
  }

  async updateStation(id: string, updateData: Partial<CreateStationDto>) {
    await this.findStationById(id);

    if (updateData.code) {
      const existingStation = await this.prisma.station.findFirst({
        where: {
          code: updateData.code,
          NOT: { id },
        },
      });

      if (existingStation) {
        throw new ConflictException(`Station with code ${updateData.code} already exists`);
      }
    }

    return this.prisma.station.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteStation(id: string) {
    await this.findStationById(id);

    // Check if station has routes
    const routesCount = await this.prisma.trainRoute.count({
      where: {
        OR: [
          { departureStationId: id },
          { arrivalStationId: id },
        ],
      },
    });

    if (routesCount > 0) {
      throw new ConflictException("Cannot delete station with existing routes");
    }

    return this.prisma.station.delete({
      where: { id },
    });
  }

  async getStationsByCity() {
    return this.prisma.station.groupBy({
      by: ["city", "province"],
      where: { isActive: true },
      _count: {
        id: true,
      },
      orderBy: [
        { province: "asc" },
        { city: "asc" },
      ],
    });
  }
}