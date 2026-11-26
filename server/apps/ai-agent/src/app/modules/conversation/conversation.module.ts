import { Module } from '@nestjs/common';

import { ConversationController } from '@ai-agent/conversation/controllers/conversation.controller';
import { ConversationRepository } from '@ai-agent/conversation/repositories/conversation.repository';
import { ConversationService } from '@ai-agent/conversation/services/conversation.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationRepository, ConversationService],
})
export class ConversationModule {}
