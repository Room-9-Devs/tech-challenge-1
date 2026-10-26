import { DomainError } from './domain.error';

export class StockBelowReservedError extends DomainError {
  readonly statusCode = 409;

  constructor(productId: string, reserved: number, requested: number) {
    super(
      `O estoque do produto com id ${productId} não pode ser ajustado para ${requested} pois possui ${reserved} unidades reservadas`,
    );
  }
}
