import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    const globalPrefix = AppModule.CONFIGURATION.GLOBAL_PREFIX;
    const port = AppModule.CONFIGURATION.APP_CONFIG.PORT;

    app.setGlobalPrefix(globalPrefix);
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors({
      origin: '*',
    });

    // Swagger Documentation
    const config = new DocumentBuilder()
      .setTitle('Backend BFF API')
      .setDescription('The Backend BFF API description')
      .setVersion('1.0.0')
      .addBearerAuth({
        description:
          'Default JWT Authorization (paste token with or without "Bearer" prefix)',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
      })
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, documentFactory);

    await app.listen(port);

    Logger.log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
      `📄 Documentation available at: http://localhost:${port}/${globalPrefix}/docs`,
    );
  } catch (error) {
    Logger.error('Application failed to start (bff service):', error);
  }
}

bootstrap();
