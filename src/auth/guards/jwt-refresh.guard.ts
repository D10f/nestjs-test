import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthRefreshGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const token = this.getTokenFromHeader(req);

    // Verify the token is valid, but has expired.
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.userService.findOne({ id: payload.sub });
      req['user'] = user;
    } catch (error) {
      if (!(error instanceof TokenExpiredError)) {
        throw error;
      }
    }
    return true;
  }

  private getTokenFromHeader(req: Request) {
    const authHeader = req.headers.authorization as string;
    const [prefix, token] = authHeader.split(' ');
    if (prefix !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing JsonWebToken.');
    }
    return token;
  }
}
