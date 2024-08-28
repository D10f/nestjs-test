import { Test, TestingModule } from '@nestjs/testing';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
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
  //let jwtService: JwtService;
  //let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UserService, JwtService, ConfigService],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    //jwtService = module.get<JwtService>(JwtService);
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
      password: 'password123',
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const res = {} as any as Response;
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
      await authService.login(user, res);
      expect(userService.findOne).toHaveBeenCalled();
      expect(userService.findOne).toHaveBeenCalledWith({
        name: user.name,
        email: user.email,
      });
    });

    it('it should invoke argon2.verify', async () => {
      await authService.login(user, res);
      expect(argonSpy).toHaveBeenCalled();
      expect(argonSpy).toHaveBeenCalledWith(user.password, user.password);
    });

    it('it should invoke authService.generateTokens', async () => {
      await authService.login(user, res);
      expect(authService.generateTokens).toHaveBeenCalled();
      expect(authService.generateTokens).toHaveBeenCalledWith(user, res);
    });

    it('it should throw an Unauthorized Exception when passwords do not match', () => {
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);
      const result = expect(authService.login(user, res));

      result.rejects.toThrow('Incorrect credentials');
      result.rejects.toThrow(UnauthorizedException);
    });

    it('it should throw an Unauthorized Exception when user is not found', () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(null);
      const result = expect(authService.login(user, res));

      result.rejects.toThrow('Incorrect credentials');
      result.rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const user = {
      password: 'password123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      sessions: [],
      save: jest.fn(),
    } as any as User;

    const refreshToken = 'token1';

    const res = {
      clearCookie: jest.fn(),
    } as any as Response;

    let findSessionSpy: jest.SpyInstance;
    let spliceSpy: jest.SpyInstance;
    let userSaveSpy: jest.SpyInstance;

    beforeEach(() => {
      user.sessions = ['token1', 'token2'];
      findSessionSpy = jest.spyOn(user.sessions, 'findIndex');
      spliceSpy = jest.spyOn(user.sessions, 'splice');
      userSaveSpy = jest.spyOn(user, 'save').mockResolvedValue(user);
    });

    it('should filter out existing user sessions', async () => {
      await authService.logout(user, refreshToken, res);
      expect(findSessionSpy).toHaveBeenCalled();
      expect(spliceSpy).toHaveBeenCalledWith(0, 1);

      await authService.logout(user, 'token2', res);
      expect(spliceSpy).toHaveBeenCalledWith(0, 1);
    });

    it('should throw an UnauthorizedException when refreshToken is missing', async () => {
      const result = expect(authService.logout(user, '', res));
      result.rejects.toThrow('Missing refresh JWT.');
      result.rejects.toThrow(UnauthorizedException);
    });

    it('should throw a JsonWebTokenError when user session does not match refresh token.', () => {
      authService.logout(user, 'non-existant', res).catch((error) => {
        expect(findSessionSpy).toHaveReturnedWith(-1);
        expect(error).toBeInstanceOf(JsonWebTokenError);
      });
    });

    it('should invoke user.save', async () => {
      await authService.logout(user, refreshToken, res);
      expect(userSaveSpy).toHaveBeenCalledWith();
    });

    it('should invoke response.clearCookie', async () => {
      await authService.logout(user, refreshToken, res);
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });
});
