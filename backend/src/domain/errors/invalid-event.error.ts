import { DomainError } from './domain.error';

export class InvalidEventError extends DomainError {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
