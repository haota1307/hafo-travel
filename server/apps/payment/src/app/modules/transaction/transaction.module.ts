import { Module } from '@nestjs/common';

import { TransactionController } from '@payment/transaction/controllers/transaction.controller';
import { TransactionRepository } from '@payment/transaction/repositories/transaction.repository';
import { TransactionService } from '@payment/transaction/services/transaction.service';

@Module({
  controllers: [TransactionController],
  providers: [TransactionRepository, TransactionService],
})
export class TransactionModule {}
