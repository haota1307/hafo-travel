import { Module } from '@nestjs/common';

import { ConversationController } from './controllers/conversation.controller';
import { ConversationRepository } from './repositories/conversation.repository';
import { ConversationService } from './services/conversation.service';

@Module({
  controllers: [ConversationController],
  providers: [ConversationRepository, ConversationService],
})
export class ConversationModule {}
