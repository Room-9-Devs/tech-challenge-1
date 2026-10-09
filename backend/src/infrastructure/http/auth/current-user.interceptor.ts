import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { AccessTokenPayload } from '@/application/ports/token-service.port';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUser } from './current-user.type';

export interface RequestWithCurrentUser extends Request {
  user?: AccessTokenPayload;
  currentUser?: CurrentUser;
}

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private readonly findCurrentUser: FindCurrentUserUseCase) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<RequestWithCurrentUser>();
    const payload = request.user;

    if (payload?.sub) {
      request.currentUser = await this.findCurrentUser.execute(payload.sub);
    }

    return next.handle();
  }
}
