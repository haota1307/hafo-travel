import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIGURATION } from '../configuration';
import { ProviderModule } from './modules/provider/provider.module';
import { RefundModule } from './modules/refund/refund.module';
import { TransactionModule } from './modules/transaction/transaction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    ProviderModule,
    RefundModule,
    TransactionModule,
  ],
})
export class AppModule {}
