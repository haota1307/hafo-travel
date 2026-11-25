import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CONFIGURATION } from '../configuration';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    NotificationModule,
  ],
})
export class AppModule {}
