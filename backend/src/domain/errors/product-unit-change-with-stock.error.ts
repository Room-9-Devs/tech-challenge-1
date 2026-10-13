import { DomainError } from './domain.error';

export class ProductUnitChangeWithStockError extends DomainError {
  readonly statusCode = 409;

  constructor(id: string) {
    super(
      `Produto com id ${id} possui estoque, então a unidade e o tipo não podem ser alterados`,
    );
  }
}
