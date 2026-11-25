import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MongoProvider } from '@common/configuration/mongo.config';

import { CONFIGURATION, TConfiguration } from '../configuration';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    MongoProvider,
    AuthModule,
    RoleModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
}
