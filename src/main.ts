import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig } from './config/schema';
import { JwtExceptionFilter } from './filters/jwt.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig>);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  app.useGlobalFilters(new JwtExceptionFilter());

  app.use(cookieParser());

  await app.listen(config.get('PORT'));
  console.log(`app running in port: ${config.get('PORT')}`);
}
bootstrap();
