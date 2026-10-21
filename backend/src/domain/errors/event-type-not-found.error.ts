import { DomainError } from './domain.error';

export class EventTypeNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(identifier: string) {
    super(`Tipo de evento não encontrado: ${identifier}`);
  }
}
