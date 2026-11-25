import { Module } from '@nestjs/common';

import { ReservationController } from './controllers/reservation.controller';
import { ReservationRepository } from './repositories/reservation.repository';
import { ReservationService } from './services/reservation.service';

@Module({
  controllers: [ReservationController],
  providers: [ReservationRepository, ReservationService],
})
export class ReservationModule {}
