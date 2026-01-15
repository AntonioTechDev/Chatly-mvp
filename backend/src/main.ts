import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS properly
  app.enableCors({
    origin: '*', // In production, replace with frontend URL (e.g., http://localhost:5173)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // properties that do not use any validation decorator are automatically stripped from the resulting DTO
    transform: true, // transform payload to DTO instances
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
