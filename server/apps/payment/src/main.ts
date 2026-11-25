import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { GrpcOptions } from '@nestjs/microservices';

import {
  GRPC_SERVICES,
  grpcServerOptions,
} from '@common/configuration/grpc.config';
import { GrpcLoggingInterceptor } from '@common/interceptors/grpc-logging.interceptor';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const options = grpcServerOptions(GRPC_SERVICES.PAYMENT_SERVICE, {
    registerPackage: false,
  });
  const app = await NestFactory.createMicroservice<GrpcOptions>(
    AppModule,
    options,
  );
  app.useGlobalInterceptors(new GrpcLoggingInterceptor());

  app.enableShutdownHooks();

  await app.listen();
  Logger.log(`Payment gRPC is listening on ${options.options.url}`);
}

bootstrap();
