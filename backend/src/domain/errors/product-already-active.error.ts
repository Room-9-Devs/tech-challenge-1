import { DomainError } from './domain.error';

export class ProductAlreadyActiveError extends DomainError {
  readonly statusCode = 409;

  constructor(id: string) {
    super(`Produto com id ${id} já está ativo`);
  }
}
