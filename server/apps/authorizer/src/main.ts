import { Logger } from '@nestjs/common';
import { connectTcpMicroservice } from '@common/interceptors/connect-tcp-microservice';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  connectTcpMicroservice(
    app,
    AppModule.CONFIGURATION.TCP_SERV.TCP_AUTHORIZER_SERVICE.options,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: AppModule.CONFIGURATION.GRPC_SERV.GRPC_AUTHORIZER_SERVICE.name,
      protoPath:
        AppModule.CONFIGURATION.GRPC_SERV.GRPC_AUTHORIZER_SERVICE.options
          .protoPath,
      url: AppModule.CONFIGURATION.GRPC_SERV.GRPC_AUTHORIZER_SERVICE.options
        .url,
    },
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.AUTHORIZER_PORT || 3304;

  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
