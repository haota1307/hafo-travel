import { Module } from '@nestjs/common';

import { CheckoutController } from './controllers/checkout.controller';
import { CheckoutRepository } from './repositories/checkout.repository';
import { CheckoutService } from './services/checkout.service';

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutRepository, CheckoutService],
})
export class CheckoutModule {}
