import { DomainError } from './domain.error';

export class ServiceTypeNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Tipo de serviço com id ${id} não encontrado`);
  }
}
