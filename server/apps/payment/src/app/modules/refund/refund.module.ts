import { Module } from '@nestjs/common';

import { RefundController } from '@payment/refund/controllers/refund.controller';
import { RefundRepository } from '@payment/refund/repositories/refund.repository';
import { RefundService } from '@payment/refund/services/refund.service';

@Module({
  controllers: [RefundController],
  providers: [RefundRepository, RefundService],
})
export class RefundModule {}
