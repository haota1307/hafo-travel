import { Module } from '@nestjs/common';

import { ToolsController } from '@ai-agent/tools/controllers/tools.controller';
import { ToolsRepository } from '@ai-agent/tools/repositories/tools.repository';
import { ToolsService } from '@ai-agent/tools/services/tools.service';

@Module({
  controllers: [ToolsController],
  providers: [ToolsRepository, ToolsService],
})
export class ToolsModule {}
