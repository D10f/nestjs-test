import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    const token = this.getTokenFromHeader(req);
    const payload = await this.jwtService.verifyAsync(token);
    req['user'] = payload;
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
