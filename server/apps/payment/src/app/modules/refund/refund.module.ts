import { Module } from '@nestjs/common';

import { RefundController } from './controllers/refund.controller';
import { RefundRepository } from './repositories/refund.repository';
import { RefundService } from './services/refund.service';

@Module({
  controllers: [RefundController],
  providers: [RefundRepository, RefundService],
})
export class RefundModule {}
