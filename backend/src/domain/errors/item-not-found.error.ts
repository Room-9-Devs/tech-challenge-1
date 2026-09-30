import { DomainError } from './domain.error';

export class ItemNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Item with id ${id} not found`);
  }
}
