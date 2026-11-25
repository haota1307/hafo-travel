import { Module } from '@nestjs/common';

import { DepartureController } from './controllers/departure.controller';
import { DepartureRepository } from './repositories/departure.repository';
import { DepartureService } from './services/departure.service';

@Module({
  controllers: [DepartureController],
  providers: [DepartureRepository, DepartureService],
})
export class DepartureModule {}
