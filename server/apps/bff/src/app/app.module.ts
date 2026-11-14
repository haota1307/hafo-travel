import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule } from '@nestjs/microservices';

import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';
import { RedisProvider } from '@common/configuration/redis.config';
import { PermissionGuard } from '@common/guards/permissions.guard';
import { UserGuard } from '@common/guards/user.guard';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { HttpResponseInterceptor } from '@common/interceptors/http-response.interceptor';
import { LoggerMiddleware } from '@common/middlewares/logger.middleware';

import { CONFIGURATION, TConfiguration } from '../configuration';
import { AuthorizerModule } from './modules/authorizer/authorizer.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => CONFIGURATION] }),
    UserModule,
    AuthorizerModule,
    RoleModule,
    ClientsModule.registerAsync([
      GrpcProvider(GRPC_SERVICES.AUTHORIZER_SERVICE),
      GrpcProvider(GRPC_SERVICES.USER_ACCESS_SERVICE),
    ]),
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
