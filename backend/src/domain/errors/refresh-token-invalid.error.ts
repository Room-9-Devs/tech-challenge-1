import { DomainError } from './domain.error';

export class RefreshTokenInvalidError extends DomainError {
  readonly statusCode = 401;

  constructor() {
    super('Invalid refresh token');
  }
}
