import { Module } from '@nestjs/common';

import { CatalogController } from '@booking/catalog/controllers/catalog.controller';
import { CatalogRepository } from '@booking/catalog/repositories/catalog.repository';
import { CatalogService } from '@booking/catalog/services/catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogRepository, CatalogService],
})
export class CatalogModule {}
