import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { AppConfig } from 'src/config/schema';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService<AppConfig>,
  ) {}

  async signup(createUserDto: CreateUserDto) {
    const userExists = await this.userService.findOne({
      name: createUserDto.name,
      email: createUserDto.email,
    });

    if (userExists) {
      throw new ConflictException('User already exists.');
    }

    return this.userService.create(createUserDto);
  }

  async login({ name, email, password }: Partial<CreateUserDto>) {
    const user = await this.userService.findOne({ name, email });

    if (!user || !(await verify(user.password, password))) {
      throw new UnauthorizedException('Incorrect credentials');
    }

    const tokens = await this.generateTokens(user);
    console.log(tokens);

    return "Fine, you're in.";
  }

  async generateTokens({ _id, name, email }: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: _id,
      name,
      email,
    });

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: _id,
      },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
      },
    );

    return { accessToken, refreshToken };
  }
}
