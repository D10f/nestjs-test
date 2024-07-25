import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import {
  ConfigModule,
  ConfigService,
  ConfigModuleOptions,
} from '@nestjs/config';
import { JwtModule, JwtModuleAsyncOptions } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AppConfig, validationSchema } from './config/schema';

const mongooseConfig: MongooseModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<AppConfig>) => {
    const name = configService.get('MONGODB_NAME');
    const user = configService.get('MONGODB_USER');
    const pass = configService.get('MONGODB_PASSWORD');

    return {
      uri: `mongodb://${user}:${pass}@mongo:27017/${name}?authSource=admin`,
    };
  },
};

const envConfig: ConfigModuleOptions = {
  ignoreEnvFile: true,
  validate: validationSchema.parse,
};

const jwtConfig: JwtModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<AppConfig>) => ({
    secret: configService.get('JWT_ACCESS_SECRET'),
    global: true,
    signOptions: {
      expiresIn: configService.get('JWT_ACCESS_EXPIRES'),
    },
  }),
};

@Module({
  imports: [
    UserModule,
    AuthModule,
    MongooseModule.forRootAsync(mongooseConfig),
    ConfigModule.forRoot(envConfig),
    JwtModule.registerAsync(jwtConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
