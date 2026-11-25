import { Module } from '@nestjs/common';

import { NotificationController } from './controllers/notification.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationRepository, NotificationService],
})
export class NotificationModule {}
