import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { verify } from 'argon2';
import { Response } from 'express';
import { AppConfig } from 'src/config/schema';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from '../user/schemas/user.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService<AppConfig>,
  ) {}

  async signup(createUserDto: CreateUserDto, res: Response) {
    const userExists = await this.userService.findOne({
      name: createUserDto.name,
      email: createUserDto.email,
    });

    if (userExists) {
      throw new ConflictException('User already exists.');
    }

    const user = await this.userService.create(createUserDto);
    return await this.generateTokens(user, res);
  }

  async login(
    { name, email, password }: Partial<CreateUserDto>,
    res: Response,
  ) {
    const user = await this.userService.findOne({ name, email });

    if (!user || !(await verify(user.password, password))) {
      throw new UnauthorizedException('Incorrect credentials');
    }

    return await this.generateTokens(user, res);
  }

  async logout(user: User, refreshToken: string, res: Response) {
    user.sessions = user.sessions.filter((t) => t !== refreshToken);
    await user.save();
    res.clearCookie('refreshToken');
  }

  async refresh(user: User, oldToken: string, res: Response) {
    let accessToken: string;

    try {
      await this.jwtService.verifyAsync(oldToken);
      accessToken = await this.generateAccessToken(user);
    } catch (error) {
      if (!(error instanceof TokenExpiredError)) {
        throw error;
      }

      user.sessions = user.sessions.filter((t) => t !== oldToken);
      this.generateRefreshToken(user, res);
    } finally {
      return { accessToken };
    }
  }

  async generateTokens(user: User, res: Response) {
    const accessToken = await this.generateAccessToken(user);
    await this.generateRefreshToken(user, res);
    return { user, accessToken };
  }

  async generateAccessToken(user: User) {
    return await this.jwtService.signAsync({
      sub: user._id,
    });
  }

  async generateRefreshToken(user: User, res: Response) {
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user._id,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
      },
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    user.sessions.push(refreshToken);
    await user.save();

    return refreshToken;
  }
}
