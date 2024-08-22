import {
  Body,
  Controller,
  Headers,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { AuthGuard } from './guards/jwt.guard';
import { AuthRefreshGuard } from './guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.signup(createUserDto, response);
  }

  @Post('login')
  login(
    @Body() createUserDto: Partial<CreateUserDto>,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(createUserDto, response);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Post('refresh')
  @UseGuards(AuthRefreshGuard)
  refresh(
    @Headers('cookie') cookies: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(cookies, res);
  }
}
