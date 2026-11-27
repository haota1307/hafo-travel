import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MongoProvider } from '@common/configuration/mongo.config';

import { AuditModule } from '@audit/audit.module';
import { CONFIGURATION, type TConfiguration } from '@audit/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    MongoProvider,
    AuditModule,
  ],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}
