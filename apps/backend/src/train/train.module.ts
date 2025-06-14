import { Module } from '@nestjs/common';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';

@Module({
  providers: [TrainService],
  controllers: [TrainController]
})
export class TrainModule {}
