import { Module } from '@nestjs/common';

import { ToolsController } from './controllers/tools.controller';
import { ToolsRepository } from './repositories/tools.repository';
import { ToolsService } from './services/tools.service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsRepository, ToolsService],
})
export class ToolsModule {}
