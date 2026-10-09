import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithCurrentUser } from './current-user.interceptor';

export const CurrentUser = createParamDecorator(
  (data: keyof import('./current-user.type').CurrentUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithCurrentUser>();
    const user = request.currentUser;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
