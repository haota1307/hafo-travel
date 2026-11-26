import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIGURATION } from '@payment/config';
import { ProviderModule } from '@payment/provider/provider.module';
import { RefundModule } from '@payment/refund/refund.module';
import { TransactionModule } from '@payment/transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    ProviderModule,
    RefundModule,
    TransactionModule,
  ],
})
export class AppModule {}
