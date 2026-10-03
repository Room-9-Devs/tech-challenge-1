import { DomainError } from './domain.error';

export class AuthenticationError extends DomainError {
  readonly statusCode = 401;

  constructor() {
    super('Invalid credentials');
  }
}
