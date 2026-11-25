import { Module } from '@nestjs/common';

import { AgentController } from './controllers/agent.controller';
import { AgentRepository } from './repositories/agent.repository';
import { AgentService } from './services/agent.service';

@Module({
  controllers: [AgentController],
  providers: [AgentRepository, AgentService],
})
export class AgentModule {}
