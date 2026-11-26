import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CatalogModule } from '@booking/catalog/catalog.module';
import { CheckoutModule } from '@booking/checkout/checkout.module';
import { CONFIGURATION } from '@booking/config';
import { DepartureModule } from '@booking/departure/departure.module';
import { ReservationModule } from '@booking/reservation/reservation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    CatalogModule,
    CheckoutModule,
    DepartureModule,
    ReservationModule,
  ],
})
export class AppModule {}
