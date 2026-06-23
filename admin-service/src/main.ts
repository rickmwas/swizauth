import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Set global API version prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS matching TSAUTH specifications
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port);
  console.log(`[TSAUTH Admin Service] Running on port ${port}`);
}
void bootstrap();
