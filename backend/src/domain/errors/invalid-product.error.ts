import { DomainError } from './domain.error';

export class InvalidProductError extends DomainError {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
