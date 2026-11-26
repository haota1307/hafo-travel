import { Module } from '@nestjs/common';

import { ProviderController } from '@payment/provider/controllers/provider.controller';
import { ProviderRepository } from '@payment/provider/repositories/provider.repository';
import { ProviderService } from '@payment/provider/services/provider.service';

@Module({
  controllers: [ProviderController],
  providers: [ProviderRepository, ProviderService],
})
export class ProviderModule {}
