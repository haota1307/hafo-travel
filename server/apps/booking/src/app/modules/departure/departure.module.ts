import { Module } from '@nestjs/common';

import { DepartureController } from '@booking/departure/controllers/departure.controller';
import { DepartureRepository } from '@booking/departure/repositories/departure.repository';
import { DepartureService } from '@booking/departure/services/departure.service';

@Module({
  controllers: [DepartureController],
  providers: [DepartureRepository, DepartureService],
})
export class DepartureModule {}
