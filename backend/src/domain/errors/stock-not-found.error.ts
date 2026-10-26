import { DomainError } from './domain.error';

export class StockNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(productId: string) {
    super(`Estoque do produto com id ${productId} não encontrado`);
  }
}
