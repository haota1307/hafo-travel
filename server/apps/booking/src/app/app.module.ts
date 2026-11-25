import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIGURATION } from '../configuration';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { DepartureModule } from './modules/departure/departure.module';
import { ReservationModule } from './modules/reservation/reservation.module';

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
