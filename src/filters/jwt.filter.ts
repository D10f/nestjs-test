import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import { Request, Response } from 'express';

type JsonWebTokenErrors = TokenExpiredError | JsonWebTokenError;

@Catch(TokenExpiredError, JsonWebTokenError)
export class JwtExceptionFilter<T extends JsonWebTokenErrors>
  implements ExceptionFilter
{
  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status = exception instanceof TokenExpiredError ? 403 : 401;

    res
      .status(status)
      .json({ statusCode: status, message: exception.message, path: req.url });
  }
}
