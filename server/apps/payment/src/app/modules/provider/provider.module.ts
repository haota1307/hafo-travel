import { Module } from '@nestjs/common';

import { ProviderController } from './controllers/provider.controller';
import { ProviderRepository } from './repositories/provider.repository';
import { ProviderService } from './services/provider.service';

@Module({
  controllers: [ProviderController],
  providers: [ProviderRepository, ProviderService],
})
export class ProviderModule {}
