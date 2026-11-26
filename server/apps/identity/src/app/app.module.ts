import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MongoProvider } from '@common/configuration/mongo.config';

import { AuthModule } from '@identity/auth/auth.module';
import { CONFIGURATION, TConfiguration } from '@identity/config';
import { RoleModule } from '@identity/role/role.module';
import { UserModule } from '@identity/user/user.module';

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
