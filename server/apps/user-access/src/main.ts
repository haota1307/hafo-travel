import { Logger } from '@nestjs/common';
import { connectTcpMicroservice } from '@common/interceptors/connect-tcp-microservice';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  connectTcpMicroservice(
    app,
    AppModule.CONFIGURATION.TCP_SERV.TCP_USER_ACCESS_SERVICE.options,
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.USER_ACCESS_PORT || 3303;

  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
