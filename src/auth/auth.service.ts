import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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

    const accessToken = await this.generateTokens(user);
    console.log(accessToken);

    return "Fine, you're in.";
  }

  async generateTokens({ _id, name, email }: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: _id,
      name,
      email,
    });

    return accessToken;
  }
}
