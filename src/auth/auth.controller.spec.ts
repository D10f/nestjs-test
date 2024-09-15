import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from 'src/user/schemas/user.schema';

jest.mock('./auth.service');
jest.mock('./guards/jwt.guard.ts');
jest.mock('./guards/jwt-refresh.guard.ts');

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('/auth/signup', () => {
    const dto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const response = { status: jest.fn() };
    let result;

    beforeEach(async () => {
      result = await authController.signup(dto, response as any as Response);
    });

    it('should invoke authService.signup', () => {
      expect(authService.signup).toHaveBeenCalled();
    });

    it('should return a new user with an access token', () => {
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('/auth/login', () => {
    const dto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    const response = {};
    let result;

    beforeEach(async () => {
      result = await authController.login(dto, response as any as Response);
    });

    it('should invoke authService.login', () => {
      expect(authService.login).toHaveBeenCalled();
    });

    it('should provide name as both name and email property to authService.login', () => {
      expect(authService.login).toHaveBeenCalledWith(
        {
          name: dto.name,
          email: dto.name,
          password: dto.password,
        },
        response as Response,
      );
    });

    it('should return a new user with an access token', () => {
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('/auth/logout', () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    const token = 'refreshToken';
    const response = { status: jest.fn() };
    let result;

    beforeEach(async () => {
      result = await authController.logout(
        user as any as User,
        token,
        response as any as Response,
      );
    });

    it('should invoke authService.logout', () => {
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should return undefined.', () => {
      expect(result).toBeUndefined();
    });
  });

  describe('/auth/refresh', () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    const token = 'refreshToken';
    const response = { status: jest.fn() };
    let result;

    beforeEach(async () => {
      result = await authController.refresh(
        user as any as User,
        token,
        response as any as Response,
      );
    });

    it('should invoke authService.refresh', () => {
      expect(authService.refresh).toHaveBeenCalled();
    });

    it('should return an access token.', () => {
      expect(result).toHaveProperty('accessToken');
    });
  });
});
