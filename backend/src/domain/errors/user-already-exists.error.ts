import { DomainError } from './domain.error';

export class UserAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}
