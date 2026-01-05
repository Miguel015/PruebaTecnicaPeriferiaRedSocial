import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './seed/seeder.service';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors();
  const port = process.env.PORT || 3000;

  // Swagger / OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Auth Microservice')
    .setDescription('Authentication microservice API')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      in: 'header'
    }, 'bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: { persistAuthorization: true }
  });

  // Run seeder
  const seeder = app.get(SeederService);
  await seeder.seed();

  // Register global exception filter to standardize error responses
  app.useGlobalFilters(new HttpExceptionFilter())

  await app.listen(port);
  Logger.log(`Auth microservice running on http://localhost:${port}`);
}

bootstrap();
