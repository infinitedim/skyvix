import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaClient, Prisma } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient<
  Prisma.PrismaClientOptions,
  "query" | "error" | "info" | "warn"
> implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "query" },
        { emit: "event", level: "error" },
        { emit: "event", level: "info" },
        { emit: "event", level: "warn" },
      ],
      errorFormat: "colorless",
    });
  }

  async onModuleInit() {
    // Log queries in development
    if (process.env.NODE_ENV === "development") {
      this.$on("query", (e: Prisma.QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log errors
    this.$on("error", (e) => {
      this.logger.error(e);
    });

    // Log warnings
    this.$on("warn", (e) => {
      this.logger.warn(e);
    });

    // Log info
    this.$on("info", (e) => {
      this.logger.log(e);
    });

    this.logger.log("Prisma Service initialized");
  }

  // Helper method for handling Prisma errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handlePrismaError(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return "Unique constraint violation";
        case "P2025":
          return "Record not found";
        case "P2003":
          return "Foreign key constraint violation";
        case "P2014":
          return "Invalid ID";
        default:
          return `Database error: ${error.message}`;
      }
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return "Unknown database error";
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return "Validation error";
    }

    return error.message || "Unknown error";
  }
}