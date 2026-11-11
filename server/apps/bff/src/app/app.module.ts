import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { UserGuard } from '@common/guards/user.guard';
import { UserModule } from './modules/user/user.module';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';
import { AuthorizerModule } from './modules/authorizer/authorizer.module';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { HttpResponseInterceptor } from '@common/interceptors/http-response.interceptor';
import { ClientsModule } from '@nestjs/microservices';
import { TCP_SERVICES, TcpProvider } from '@common/configuration/tcp.config';
import { PermissionGuard } from '@common/guards/permissions.guard';
import { RedisProvider } from '@common/configuration/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    UserModule,
    AuthorizerModule,
    ClientsModule.registerAsync([TcpProvider(TCP_SERVICES.AUTHORIZER_SERVICE)]),
    RedisProvider,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ExceptionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_GUARD, useClass: UserGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule implements NestModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(
        { path: '', method: RequestMethod.ALL },
        { path: '*path', method: RequestMethod.ALL },
      );
  }
}
