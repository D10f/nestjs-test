import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';

jest.mock('argon2');

describe('UserService', () => {
  let service: UserService;
  let model: Model<User>;

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<User>>(getModelToken(User.name));

    jest.clearAllMocks();
  });

  describe('create', () => {
    const userDto = {
      name: 'John',
      email: 'john@example.com',
      password: 'mynameisjohn',
    };

    it('should invoke userModel.create', async () => {
      await service.create(userDto);
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should hash the password', async () => {
      const argonSpy = jest.spyOn(argon2, 'hash').mockResolvedValue('hash');
      await service.create(userDto);
      expect(argonSpy).toHaveBeenCalledWith(userDto.password);
    });
  });

  describe('findOne', () => {
    const findUserDto = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
    };

    it('should invoke userModel.findOne', async () => {
      await service.findOne(findUserDto);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { _id: findUserDto.id },
          { name: findUserDto.name },
          { email: { $exists: true, $eq: findUserDto.email } },
        ],
      });
    });
  });

  describe('update', () => {
    const user = {
      email: 'johnathan@example.com',
      password: 'password',
      save: jest.fn(),
    } as unknown as User;

    it('should invoke user.save', async () => {
      await service.update(user, { email: 'new' });
      expect(user.save).toHaveBeenCalled();
    });

    it('should not invoke user.save if there is nothing to update', async () => {
      await service.update(user, {});
      expect(user.save).not.toHaveBeenCalled();
    });

    it('should not invoke argon2.hash if there is nothing to update', async () => {
      const argonSpy = jest.spyOn(argon2, 'hash');
      await service.update(user, {});
      expect(argonSpy).not.toHaveBeenCalled();
    });

    it("should update user's email property", async () => {
      await service.update(user, { email: 'newEmail@example.com' });
      expect(user.email).toBe('newEmail@example.com');
    });

    it("should not invoke argon2.hash when password isn't provided", async () => {
      const argonSpy = jest.spyOn(argon2, 'hash');
      await service.update(user, { email: 'newEmail@example.com' });
      expect(argonSpy).not.toHaveBeenCalled();
      expect(user.password).toBe(user.password);
    });

    it("should update user's password property (and hashed)", async () => {
      const argonSpy = jest.spyOn(argon2, 'hash').mockResolvedValue('hash');
      await service.update(user, { password: 'test' });
      expect(argonSpy).toHaveBeenCalledWith('test');
      expect(user.password).toBe('hash');
    });
  });
});
