import { Module } from '@nestjs/common';

import { ReservationController } from '@booking/reservation/controllers/reservation.controller';
import { ReservationRepository } from '@booking/reservation/repositories/reservation.repository';
import { ReservationService } from '@booking/reservation/services/reservation.service';

@Module({
  controllers: [ReservationController],
  providers: [ReservationRepository, ReservationService],
})
export class ReservationModule {}
