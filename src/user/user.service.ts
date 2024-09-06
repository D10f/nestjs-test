import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { hash } from 'argon2';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create({ name, email, password }: CreateUserDto) {
    return this.userModel.create({
      name,
      email,
      password: await hash(password),
    });
  }

  findOne({ id, name, email }: FindOneUserDto) {
    return this.userModel.findOne({
      $or: [{ _id: id }, { name }, { email }],
    });
  }

  async update(user: User, updateUserDto: UpdateUserDto) {
    for (const prop in updateUserDto) {
      switch (prop as keyof UpdateUserDto) {
        case 'password':
          user.password = await hash(prop);
          break;
        default:
          user[prop] = updateUserDto[prop];
          break;
      }
    }

    return await user.save();
  }
}
