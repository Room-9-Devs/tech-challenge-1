import { DomainError } from './domain.error';

export class ProductNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Produto com id ${id} não encontrado`);
  }
}
