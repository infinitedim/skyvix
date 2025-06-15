/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { BookingService } from "./booking.service";
import { CreateBookingDto } from "@/train/dto/create-booking.dto";
import { AuthGuard } from "@/auth/guard/auth.guard";
import { BookingStatus } from "@prisma/client";

@Controller("bookings")
@UseGuards(AuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Request() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.createBooking(req.user.id, createBookingDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.bookingService.findAllBookings(query);
  }

  @Get("my-bookings")
  findMyBookings(@Request() req: any, @Query() query: any) {
    return this.bookingService.findUserBookings(req.user.id, query);
  }

  @Get("code/:code")
  findByCode(@Param("code") code: string) {
    return this.bookingService.findBookingByCode(code);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.bookingService.findBookingById(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: BookingStatus,
  ) {
    return this.bookingService.updateBookingStatus(id, status);
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @Request() req: any) {
    return this.bookingService.cancelBooking(id, req.user.id);
  }
}