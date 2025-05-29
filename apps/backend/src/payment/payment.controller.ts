import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { CreatePaymentDto, UpdatePaymentDto, XenditWebhookDto } from "@skyvix/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";

@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() user: User,
  ) {
    return this.paymentService.create(createPaymentDto, user.id);
  }

  @Post("create-invoice")
  @UseGuards(JwtAuthGuard)
  async createInvoice(
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() user: User,
  ) {
    return this.paymentService.createXenditInvoice(createPaymentDto, user.id);
  }

  @Post("webhook/xendit")
  @HttpCode(HttpStatus.OK)
  async handleXenditWebhook(
    @Body() webhookData: XenditWebhookDto,
    @Headers("x-callback-token") callbackToken: string,
  ) {
    return this.paymentService.handleXenditWebhook(webhookData, callbackToken);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @GetUser() user: User,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = parseInt(page || "1") || 1;
    const limitNum = parseInt(limit || "10") || 10;
    return this.paymentService.findAll(user.id, status, pageNum, limitNum);
  }

  @Get("admin/all")
  @UseGuards(JwtAuthGuard)
  async findAllForAdmin(
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("userId") userId?: string,
  ) {
    const pageNum = parseInt(page || "1") || 1;
    const limitNum = parseInt(limit || "10") || 10;
    return this.paymentService.findAllForAdmin(status, pageNum, limitNum, userId);
  }

  @Get("statistics")
  @UseGuards(JwtAuthGuard)
  async getPaymentStatistics(@GetUser() user: User) {
    return this.paymentService.getPaymentStatistics(user.id);
  }

  @Get("admin/statistics")
  @UseGuards(JwtAuthGuard)
  async getAdminPaymentStatistics() {
    return this.paymentService.getAdminPaymentStatistics();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findOne(@Param("id") id: string, @GetUser() user: User) {
    return this.paymentService.findOne(id, user.id);
  }

  @Get(":id/status")
  @UseGuards(JwtAuthGuard)
  async checkPaymentStatus(@Param("id") id: string, @GetUser() user: User) {
    return this.paymentService.checkPaymentStatus(id, user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @GetUser() user: User,
  ) {
    return this.paymentService.update(id, updatePaymentDto, user.id);
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  async cancelPayment(@Param("id") id: string, @GetUser() user: User) {
    return this.paymentService.cancelPayment(id, user.id);
  }

  @Patch(":id/refund")
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @Param("id") id: string,
    @GetUser() user: User,
    @Body("reason") reason?: string,
  ) {
    return this.paymentService.refundPayment(id, user.id, reason);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@Param("id") id: string, @GetUser() user: User) {
    return this.paymentService.remove(id, user.id);
  }

  @Post(":id/retry")
  @UseGuards(JwtAuthGuard)
  async retryPayment(@Param("id") id: string, @GetUser() user: User) {
    return this.paymentService.retryPayment(id, user.id);
  }

  @Get("order/:orderId")
  @UseGuards(JwtAuthGuard)
  async getPaymentsByOrder(
    @Param("orderId") orderId: string,
    @GetUser() user: User,
  ) {
    return this.paymentService.getPaymentsByOrder(orderId, user.id);
  }
}