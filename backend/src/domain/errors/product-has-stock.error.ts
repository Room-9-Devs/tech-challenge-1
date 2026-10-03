import { DomainError } from './domain.error';

export class ItemHasStockError extends DomainError {
  readonly statusCode = 409;

  constructor(id: string) {
    super(`Item with id ${id} cannot be deactivated because it has stock`);
  }
}
