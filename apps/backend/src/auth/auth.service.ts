import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma";
import { RegisterDto, LoginDto, RefreshTokenDto } from "@/auth/dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { email, password, ...profileData } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

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
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
          profile: true,
        },
      });
    });

    if (!user) {
      throw new BadRequestException("Failed to create user");
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
      message: "User registered successfully",
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
      message: "Login successful",
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { profile: true },
      });

      if (!user || !user.isActive || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Update refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        ...tokens,
        message: "Tokens refreshed successfully",
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async logout(userId: string) {
    // Remove refresh token
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: "Logout successful" };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, profileData: Partial<RegisterDto>) {
    const { email, password, ...updateData } = profileData;

    return await this.prisma.$transaction(async (tx) => {
      // Update user email if provided
      if (email) {
        const existingUser = await tx.user.findFirst({
          where: {
            email,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          throw new ConflictException("Email already exists");
        }

        await tx.user.update({
          where: { id: userId },
          data: { email },
        });
      }

      // Update password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      }

      // Update or create profile
      if (Object.keys(updateData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId },
          update: updateData,
          create: {
            userId,
            ...updateData,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
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

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: this.configService.get<string>("JWT_EXPIRES_IN") || "15m",
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") || "7d",
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}