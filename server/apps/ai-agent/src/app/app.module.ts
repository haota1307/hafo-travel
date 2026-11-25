import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIGURATION } from '../configuration';
import { AgentModule } from './modules/agent/agent.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { ToolsModule } from './modules/tools/tools.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    AgentModule,
    ConversationModule,
    ToolsModule,
  ],
})
export class AppModule {}
