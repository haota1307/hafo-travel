import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIGURATION } from '@notification/config';
import { NotificationModule } from '@notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    NotificationModule,
  ],
})
export class AppModule {}
