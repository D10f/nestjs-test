import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const Cookie = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookies = request.headers.cookie;

    if (!cookies) return null;

    const re = new RegExp(`${data}=[^;]+`);
    const match = cookies.match(re);
    return match ? match[0].split('=')[1] : null;
  },
);
