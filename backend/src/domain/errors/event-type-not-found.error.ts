import { DomainError } from './domain.error';

export class EventTypeNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(identifier: string) {
    super(`Event type not found: ${identifier}`);
  }
}
