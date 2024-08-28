import { Test, TestingModule } from '@nestjs/testing';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User } from '../user/schemas/user.schema';
import * as argon2 from 'argon2';
import { UnauthorizedException } from '@nestjs/common';
import { argv0 } from 'process';

jest.mock('argon2');
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

    beforeEach(() => {
      jest.spyOn(authService, 'invalidateToken').mockResolvedValue(undefined);
    });

    it('should invoke authService.invalidateToken', async () => {
      await authService.logout(user, refreshToken, res);
      expect(authService.invalidateToken).toHaveBeenCalledWith(
        user,
        refreshToken,
      );
    });

    it('should invoke response.clearCookie', async () => {
      await authService.logout(user, refreshToken, res);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('invalidateToken', () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      sessions: ['token1', 'token2'],
      save: jest.fn(),
    } as any as User;

    const token = user.sessions[0];

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
      jest.spyOn(res, 'clearCookie').mockReturnValue(undefined);
    });

    it('should throw an UnauthorizedException when refreshToken is missing', async () => {
      const result = expect(authService.logout(user, '', res));
      result.rejects.toThrow('Missing refresh JWT.');
      result.rejects.toThrow(UnauthorizedException);
    });

    it('should throw an JsonWebTokenError when session does not exist for given token.', async () => {
      const result = expect(authService.logout(user, 'blah', res));
      result.rejects.toThrow('Invalid refresh JWT.');
      result.rejects.toThrow(JsonWebTokenError);
    });

    it('should remove token from user sessions array', async () => {
      await authService.logout(user, user.sessions[0], res);
      expect(findSessionSpy).toHaveBeenCalled();
      expect(spliceSpy).toHaveBeenCalledWith(0, 1);
    });

    it('should invoke user.save', async () => {
      await authService.logout(user, token, res);
      expect(userSaveSpy).toHaveBeenCalled();
    });
  });

  describe.only('refresh', () => {
    const user = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      sessions: ['token1', 'token2'],
    } as any as User;

    const token = user.sessions[0];

    const res = {} as any as Response;

    beforeEach(() => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({});
      jest.spyOn(authService, 'generateAccessToken').mockResolvedValue('token');
      jest.spyOn(authService, 'invalidateToken').mockResolvedValue(undefined);
      jest
        .spyOn(authService, 'generateRefreshToken')
        .mockResolvedValue('token');
    });

    it('should invoke jwtService.verifyAsync', async () => {
      await authService.refresh(user, token, res);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });

    it('should invoke authService.generateAccessToken', async () => {
      await authService.refresh(user, token, res);
      expect(authService.generateAccessToken).toHaveBeenCalledWith(user);
    });

    it('should return a new access token', async () => {
      const result = await authService.refresh(user, token, res);
      expect(result).toEqual({ accessToken: 'token' });
    });

    it('should invoke authService.invalidateToken if refresh token has expired', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new TokenExpiredError('Expired token', new Date()));

      await authService.refresh(user, token, res);
      expect(authService.invalidateToken).toHaveBeenCalledWith(user, token);
    });

    it('should invoke authService.generateRefreshToken if refresh token has expired.', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new TokenExpiredError('Expired token', new Date()));

      await authService.refresh(user, token, res);
      expect(authService.generateRefreshToken).toHaveBeenCalledWith(user, res);
    });

    it('should not return a valid access token if refresth token is expired.', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new JsonWebTokenError('Invalid'));

      await expect(authService.refresh(user, token, res)).resolves.toEqual({
        accessToken: undefined,
      });
      expect(authService.generateAccessToken).not.toHaveBeenCalled();
      expect(authService.generateRefreshToken).not.toHaveBeenCalled();
      expect(authService.invalidateToken).not.toHaveBeenCalled();
    });
  });
});
