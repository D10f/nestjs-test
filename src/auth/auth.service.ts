import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { hash, verify } from 'argon2';
import { SignupDto } from './dto/signup.dto';
import { User } from './schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RefreshToken } from './schemas/refresh-token.schema';
import { SchemaOut } from '../config/config.schema';
import { RefreshTokenDto } from './dto/refresh.dto';

// https://www.mongodb.com/docs/manual/reference/error-codes/#mongodb-error-11000
//const DUPLICATE_KEY = 'E11000';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService<SchemaOut>,
  ) {}

  async signup({ name, email, password }: SignupDto) {
    const emailInUse = await this.userModel.findOne({ email }, { lean: true });

    if (emailInUse) {
      throw new ConflictException('Email address already in use!');
    }

    const hashedPassword = await hash(password);

    return await this.userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  }

  async login({ email, password }: LoginDto) {
    const user = await this.userModel.findOne(
      { email },
      { password: 1 },
      { lean: true },
    );

    if (!user || !(await verify(user.password, password))) {
      throw new UnauthorizedException('Incorrect credentials.');
    }

    const { accessToken, refreshToken } = this.generateUserTokens(user.id);
    return { accessToken, refreshToken };
  }

  async refreshTokens({ token }: RefreshTokenDto) {
    const tokenExists = await this.refreshTokenModel.findOne(
      { token },
      { token: 1, userId: 1 },
      { lean: true },
    );

    if (!tokenExists) {
      throw new UnauthorizedException('Invalid session token.');
    }

    if (!this.jwtService.verify(tokenExists.token)) {
      throw new UnauthorizedException(
        'Session has expired. Please, login again.',
      );
    }

    return this.generateUserTokens(tokenExists.userId.toString());
  }

  private generateUserTokens(userId: string) {
    const accessToken = this.jwtService.sign({ userId });

    const refreshToken = this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
      },
    );

    this.refreshTokenModel.create({ token: refreshToken, userId });

    return { accessToken, refreshToken };
  }
}
