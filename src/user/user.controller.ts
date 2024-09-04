import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/decorators/user.decorator';
import { User as UserSchema } from '../user/schemas/user.schema';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('update')
  @UseGuards(AuthGuard)
  update(@User() user: UserSchema, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(user, updateUserDto);
  }
}
