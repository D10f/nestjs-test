import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigModuleOptions,
  ConfigService,
} from '@nestjs/config';
import { MongooseModule, MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { schema, SchemaOut } from './config/config.schema';
import { JwtModule } from '@nestjs/jwt';

const appConfig: ConfigModuleOptions = {
  ignoreEnvFile: true,
  validate: schema.parse,
};

const mongooseConfig: MongooseModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<SchemaOut>) => {
    const name = configService.get('MONGODB_NAME');
    const user = configService.get('MONGODB_USER');
    const password = configService.get('MONGODB_PASSWORD');
    return {
      uri: `mongodb://${user}:${password}@mongo:27017/${name}?authSource=admin`,
    };
  },
};

const jwtConfig = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService<SchemaOut>) => ({
    secret: configService.get('JWT_ACCESS_SECRET'),
    global: true,
    signOptions: {
      expiresIn: configService.get('JWT_ACCESS_EXPIRES'),
    },
  }),
};

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(appConfig),
    MongooseModule.forRootAsync(mongooseConfig),
    JwtModule.registerAsync(jwtConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
