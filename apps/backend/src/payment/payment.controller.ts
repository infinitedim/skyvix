/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { UpdatePaymentDto } from "./dto/update-payment.dto";
import { PaymentQueryDto } from "./dto/payment-query.dto";
import { XenditWebhookDto, PaymentCallbackDto } from "./dto/webhook.dto";
import { AuthGuard } from "@/auth/guard/auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("Payments")
@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new payment" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "Payment created successfully" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid payment data" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Order not found" })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return {
      statusCode: HttpStatus.CREATED,
      message: "Payment created successfully",
      data: await this.paymentService.createPayment(createPaymentDto),
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all payments with filtering and pagination" })
  @ApiResponse({ status: HttpStatus.OK, description: "Payments retrieved successfully" })
  async findAll(@Query() query: PaymentQueryDto) {
    return {
      statusCode: HttpStatus.OK,
      message: "Payments retrieved successfully",
      ...(await this.paymentService.findAllPayments(query)),
    };
  }

  @Get("stats")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment statistics" })
  @ApiResponse({ status: HttpStatus.OK, description: "Payment statistics retrieved successfully" })
  async getStats(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return {
      statusCode: HttpStatus.OK,
      message: "Payment statistics retrieved successfully",
      data: await this.paymentService.getPaymentStats(startDate, endDate),
    };
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment by ID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Payment retrieved successfully" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Payment not found" })
  async findOne(@Param("id") id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: "Payment retrieved successfully",
      data: await this.paymentService.findPaymentById(id),
    };
  }

  @Get("reference/:reference")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get payment by reference" })
  @ApiResponse({ status: HttpStatus.OK, description: "Payment retrieved successfully" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Payment not found" })
  async findByReference(@Param("reference") reference: string) {
    return {
      statusCode: HttpStatus.OK,
      message: "Payment retrieved successfully",
      data: await this.paymentService.findPaymentByReference(reference),
    };
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update payment" })
  @ApiResponse({ status: HttpStatus.OK, description: "Payment updated successfully" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Payment not found" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid update data" })
  async update(@Param("id") id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return {
      statusCode: HttpStatus.OK,
      message: "Payment updated successfully",
      data: await this.paymentService.updatePayment(id, updatePaymentDto),
    };
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete payment" })
  @ApiResponse({ status: HttpStatus.OK, description: "Payment deleted successfully" })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Payment not found" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Cannot delete completed payment" })
  async remove(@Param("id") id: string) {
    return {
      statusCode: HttpStatus.OK,
      ...(await this.paymentService.deletePayment(id)),
    };
  }

  @Post("webhook/xendit")
  @ApiOperation({ summary: "Handle Xendit webhook" })
  @ApiResponse({ status: HttpStatus.OK, description: "Webhook processed successfully" })
  async handleXenditWebhook(@Body() webhookData: XenditWebhookDto) {
    return {
      statusCode: HttpStatus.OK,
      ...(await this.paymentService.processWebhook(webhookData)),
    };
  }

  @Post("callback")
  @ApiOperation({ summary: "Handle payment callback" })
  @ApiResponse({ status: HttpStatus.OK, description: "Callback processed successfully" })
  async handleCallback(@Body() callbackData: PaymentCallbackDto) {
    return {
      statusCode: HttpStatus.OK,
      message: "Callback processed successfully",
    };
  }
}