import { DomainError } from './domain.error';

export class InvalidEventTypeError extends DomainError {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
