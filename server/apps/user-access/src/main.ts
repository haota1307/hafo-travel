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
  const options = grpcServerOptions(GRPC_SERVICES.USER_ACCESS_SERVICE);
  const app = await NestFactory.createMicroservice<GrpcOptions>(
    AppModule,
    options,
  );
  app.useGlobalInterceptors(new GrpcLoggingInterceptor());

  await app.listen();
  Logger.log(`User-access gRPC is listening on ${options.options.url}`);
}

bootstrap();
