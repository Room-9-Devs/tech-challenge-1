import { DomainError } from './domain.error';

export class ProductHasStockError extends DomainError {
  readonly statusCode = 409;

  constructor(id: string) {
    super(`Produto com id ${id} não pode ser desativado pois possui estoque`);
  }
}
