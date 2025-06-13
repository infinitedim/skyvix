/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserQueryDto } from "./dto/user-query.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, ...profileData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          isActive: createUserDto.isActive ?? true,
        },
      });

      // Create profile if profile data is provided
      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.create({
          data: {
            userId: newUser.id,
            ...profileData,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: newUser.id },
        include: { profile: true },
      });
    });

    return user;
  }

  async findAll(query: UserQueryDto) {
    const {
      search,
      city,
      province,
      isActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { firstName: { contains: search, mode: "insensitive" } } },
        { profile: { lastName: { contains: search, mode: "insensitive" } } },
        { profile: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (city || province) {
      where.profile = {};
      if (city) where.profile.city = { contains: city, mode: "insensitive" };
      if (province) where.profile.address = { contains: province, mode: "insensitive" };
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              orders: true,
              payments: true,
              bookings: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ],);

    return {
      data: users,
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        orders: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        payments: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            schedule: {
              include: {
                route: {
                  include: {
                    departureStation: true,
                    arrivalStation: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            payments: true,
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { email, password, ...profileData } = updateUserDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException("User not found");
    }

    return await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      // Update email if provided and different
      if (email && email !== existingUser.email) {
        const emailExists = await tx.user.findFirst({
          where: {
            email,
            NOT: { id },
          },
        });

        if (emailExists) {
          throw new ConflictException("Email already exists");
        }

        updateData.email = email;
      }

      // Update password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      // Update isActive if provided
      if (updateUserDto.isActive !== undefined) {
        updateData.isActive = updateUserDto.isActive;
      }

      // Update user
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id },
          data: updateData,
        });
      }

      // Update or create profile
      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId: id },
          update: profileData,
          create: {
            userId: id,
            ...profileData,
          },
        });
      }

      return tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
        },
      });
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Soft delete by deactivating user
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "User deactivated successfully" };
  }

  async hardDelete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user has related data
    const relatedData = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            payments: true,
            bookings: true,
          },
        },
      },
    });

    if (!relatedData) {
      throw new NotFoundException("User not found");
    }

    if (relatedData._count.orders > 0 || relatedData._count.payments > 0 || relatedData._count.bookings > 0) {
      throw new BadRequestException("Cannot delete user with existing orders, payments, or bookings");
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: "User deleted successfully" };
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear refresh token
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
        refreshToken: null, // Force re-login
      },
    });

    return { message: "Password changed successfully" };
  }

  async toggleStatus(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    return updatedUser;
  }

  async getUserStats(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const stats = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            payments: true,
            bookings: true,
          },
        },
      },
    });

    // Get order statistics
    const orderStats = await this.prisma.order.groupBy({
      by: ["status"],
      where: { userId: id },
      _count: true,
    });

    // Get payment statistics
    const paymentStats = await this.prisma.payment.groupBy({
      by: ["status"],  
      where: { userId: id },
      _count: true,
      _sum: { amount: true },
    });

    // Get booking statistics
    const bookingStats = await this.prisma.trainBooking.groupBy({
      by: ["status"],
      where: { userId: id },
      _count: true,
      _sum: { totalPrice: true },
    });

    if(!stats) {
      throw new NotFoundException("Stats not found");
    }

    return {
      user: {
        id: stats.id,
        email: stats.email,
        isActive: stats.isActive,
        createdAt: stats.createdAt,
      },
      counts: stats._count,
      orderStats: orderStats.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {}),
      paymentStats: {
        statusCounts: paymentStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {}),
        totalAmount: paymentStats.reduce((sum, curr) => sum + (curr._sum.amount?.toNumber() || 0), 0),
      },
      bookingStats: {
        statusCounts: bookingStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {}),
        totalSpent: bookingStats.reduce((sum, curr) => sum + (curr._sum.totalPrice?.toNumber() || 0), 0),
      },
    };
  }
}