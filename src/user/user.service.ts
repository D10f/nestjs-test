import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { hash } from 'argon2';
import { User } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneUserDto } from './dto/find-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create({ name, email, password }: CreateUserDto) {
    return this.userModel.create({
      name,
      email,
      password: await hash(password),
    });
  }

  findOne({ name, email }: FindOneUserDto) {
    return this.userModel.findOne({
      $or: [{ name }, { email }],
    });
  }
}
