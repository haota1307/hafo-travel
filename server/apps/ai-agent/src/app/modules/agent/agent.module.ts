import { Module } from '@nestjs/common';

import { AgentController } from '@ai-agent/agent/controllers/agent.controller';
import { AgentRepository } from '@ai-agent/agent/repositories/agent.repository';
import { AgentService } from '@ai-agent/agent/services/agent.service';

@Module({
  controllers: [AgentController],
  providers: [AgentRepository, AgentService],
})
export class AgentModule {}
