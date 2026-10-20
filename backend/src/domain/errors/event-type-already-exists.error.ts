import { DomainError } from './domain.error';

export class EventTypeAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(code: string) {
    super(`Já existe um tipo de evento com o código "${code}"`);
  }
}
