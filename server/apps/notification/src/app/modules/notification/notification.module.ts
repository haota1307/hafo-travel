import { Module } from '@nestjs/common';

import { NotificationController } from '@notification/controllers/notification.controller';
import { NotificationService } from '@notification/services/notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
