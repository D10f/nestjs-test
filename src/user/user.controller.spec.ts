import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';

jest.mock('./user.service');
jest.mock('../auth/guards/jwt.guard.ts');
jest.mock('../auth/guards/jwt-refresh.guard.ts');

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('/user/update', () => {
    const user = {
      name: 'John Doe',
      password: 'password',
    };

    const updateDto = {
      email: 'new@example.com',
      password: 'newPassword',
    };

    let result;

    beforeEach(async () => {
      result = await controller.update(user as User, updateDto);
    });

    it('should invoke userService.update', () => {
      expect(service.update).toHaveBeenCalledWith(user as User, updateDto);
    });

    it.skip('should return a user object', () => {
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('password');
    });
  });
});
