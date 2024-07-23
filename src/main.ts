import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchemaOut } from './config/config.schema';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  const config = app.get(ConfigService<SchemaOut>);
  const logger = new Logger('Main Script');
  await app.listen(config.get('PORT'));
  logger.log(`The app is running on ${config.get('PORT')}!`);
}
bootstrap();
