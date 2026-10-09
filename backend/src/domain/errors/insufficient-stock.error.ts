import { DomainError } from './domain.error';

export class InsufficientStockError extends DomainError {
  readonly statusCode = 409;

  constructor(productId: string, available: number, requested: number) {
    super(
      `Estoque insuficiente para o produto com id ${productId}: disponível ${available}, solicitado ${requested}`,
    );
  }
}
