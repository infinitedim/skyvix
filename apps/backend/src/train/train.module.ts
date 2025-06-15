import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma";
import { TrainService } from "./train.service";
import { TrainController } from "./train.controller";
import { AuthGuard } from "@/auth/guard/auth.guard";
import { StationController } from "./station/station.controller";
import { StationService } from "./station/station.service";
import { BookingController } from "./booking/booking.controller";
import { BookingService } from "./booking/booking.service";
import { ScheduleService } from "./schedule/schedule.service";
import { ScheduleController } from "./schedule/schedule.controller";

@Module({
  imports: [PrismaModule],
  providers: [
    TrainService,
    StationService,
    ScheduleService,
    BookingService,
    AuthGuard,
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
