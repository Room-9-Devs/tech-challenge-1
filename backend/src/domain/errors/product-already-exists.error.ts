import { DomainError } from './domain.error';

export class ProductAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(sku: string) {
    super(`Já existe um produto com o SKU ${sku}`);
  }
}
