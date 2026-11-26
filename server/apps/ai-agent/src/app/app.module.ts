import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgentModule } from '@ai-agent/agent/agent.module';
import { CONFIGURATION } from '@ai-agent/config';
import { ConversationModule } from '@ai-agent/conversation/conversation.module';
import { ToolsModule } from '@ai-agent/tools/tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    AgentModule,
    ConversationModule,
    ToolsModule,
  ],
})
export class AppModule {}
