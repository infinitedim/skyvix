import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma";
import { TrainService } from "./train.service";
import { TrainController } from "./train.controller";
import { StationController } from "./station/station.controller";
import { StationService } from "./station/station.service";
import { BookingController } from "./booking/booking.controller";
import { BookingService } from "./booking/booking.service";
import { ScheduleService } from "./schedule/schedule.service";
import { ScheduleController } from "./schedule/schedule.controller";

@Module({
  imports: [
    PrismaModule,
    // Remove JwtModule import since AuthModule is global
    // Remove AuthGuard from imports since it's global
  ],
  providers: [
    TrainService,
    StationService,
    ScheduleService,
    BookingService,
    // Remove AuthGuard from providers since it's global
  ],
  controllers: [
    TrainController,
    StationController,
    ScheduleController,
    BookingController,
  ],
  exports: [
    TrainService,
    StationService,
    ScheduleService,
    BookingService,
  ],
})
export class TrainModule {}