import { DomainError } from './domain.error';

export class ItemAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(sku: string) {
    super(`Item with SKU ${sku} already exists`);
  }
}
