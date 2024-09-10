import { NestFactory } from '@nestjs/core';
import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfig } from './config/schema';
import { JwtExceptionFilter } from './filters/jwt.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig>);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory(errors) {
        return new UnprocessableEntityException(
          errors.map((error) => ({
            property: error.property,
            message: error.constraints[Object.keys(error.constraints)[0]],
          })),
        );
      },
    }),
  );

  app.useGlobalFilters(new JwtExceptionFilter());

  app.use(cookieParser());

  app.enableCors({
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    origin: config.get('NODE_ENV') === 'production' ? false : '*',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(config.get('PORT'));
  console.log(`app running in port: ${config.get('PORT')}`);
}
bootstrap();
