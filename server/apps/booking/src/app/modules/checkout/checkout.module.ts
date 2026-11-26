import { Module } from '@nestjs/common';

import { CheckoutController } from '@booking/checkout/controllers/checkout.controller';
import { CheckoutRepository } from '@booking/checkout/repositories/checkout.repository';
import { CheckoutService } from '@booking/checkout/services/checkout.service';

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutRepository, CheckoutService],
})
export class CheckoutModule {}
