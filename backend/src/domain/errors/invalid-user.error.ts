import { DomainError } from './domain.error';

export class InvalidUserError extends DomainError {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
