import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, UpdateOrderDto } from "@skyvix/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { Order, OrderStatus } from "@prisma/client";

@ApiTags("orders")
@Controller("orders")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req): Promise<Order> {
    return this.ordersService.create({
      ...createOrderDto,
      userId: req.user.id,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Get all orders (Admin only)" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  async findAll(@Query("userId") userId?: string): Promise<Order[]> {
    return this.ordersService.findAll(userId);
  }

  @Get("my-orders")
  @ApiOperation({ summary: "Get current user's orders" })
  @ApiResponse({ status: 200, description: "User orders retrieved successfully" })
  async getUserOrders(@Request() req): Promise<Order[]> {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id") id: string, @Request() req): Promise<Order> {
    // Admin can view any order, regular users can only view their own
    const userId = req.user.role === "admin" ? undefined : req.user.id;
    return this.ordersService.findOne(id, userId);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Update order (Admin only)" })
  @ApiResponse({ status: 200, description: "Order updated successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async update(
    @Param("id") id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Update order status (Admin only)" })
  @ApiResponse({ status: 200, description: "Order status updated successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: OrderStatus,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, status);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Delete order (Admin only)" })
  @ApiResponse({ status: 204, description: "Order deleted successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string): Promise<void> {
    return this.ordersService.remove(id);
  }
}