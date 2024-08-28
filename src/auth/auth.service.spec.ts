import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User } from '../user/schemas/user.schema';
import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('argon2');
jest.mock('@nestjs/jwt');
jest.mock('@nestjs/config');
jest.mock('../user/user.service');

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  //let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UserService, JwtService, ConfigService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    //configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('signup', () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const dto = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        user: user as any as User,
        accessToken: 'accessToken',
      });
    });

    it('it should invoke userService.findOne', async () => {
      await authService.signup(dto, {} as any as Response);
      expect(userService.findOne).toHaveBeenCalled();
    });

    it('it should invoke userService.create', async () => {
      await authService.signup(dto, {} as any as Response);
      expect(userService.create).toHaveBeenCalled();
    });

    it('it should invoke authService.generateTokens', async () => {
      await authService.signup(dto, {} as any as Response);
      expect(authService.generateTokens).toHaveBeenCalled();
    });

    it('it resolves without errors', () => {
      expect(authService.signup(dto, {} as any as Response)).resolves;
    });

    it('it should throw an error when user already exists', () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(user as any);
      expect(authService.signup(dto, {} as any as Response)).rejects.toThrow(
        'User already exists.',
      );

      expect(userService.create).not.toHaveBeenCalled();
      expect(authService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const credentials = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    };

    let argonSpy: jest.SpyInstance;

    beforeEach(async () => {
      jest.spyOn(authService, 'generateTokens').mockResolvedValue({
        user: user as any as User,
        accessToken: 'accessToken',
      });

      jest.spyOn(userService, 'findOne').mockResolvedValue(user as any);
      argonSpy = jest.spyOn(argon2, 'verify').mockResolvedValue(true);
    });

    it('it should invoke userService.findOne', async () => {
      await authService.login(credentials, {} as any as Response);
      expect(userService.findOne).toHaveBeenCalled();
    });

    it('it should invoke argon2.verify', async () => {
      await authService.login(credentials, {} as any as Response);
      expect(argonSpy).toHaveBeenCalled();
    });

    it('it should invoke authService.generateTokens', async () => {
      await authService.login(credentials, {} as any as Response);
      expect(authService.generateTokens).toHaveBeenCalled();
    });

    it('it should throw an Unauthorized Exception when passwords do not match', () => {
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);
      const result = expect(
        authService.login(credentials, {} as any as Response),
      );

      result.rejects.toThrow('Incorrect credentials');
      result.rejects.toThrow(UnauthorizedException);
    });

    it('it should throw an Unauthorized Exception when user is not found', () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(null);
      const result = expect(
        authService.login(credentials, {} as any as Response),
      );

      result.rejects.toThrow('Incorrect credentials');
      result.rejects.toThrow(UnauthorizedException);
    });
  });
});
