import { DomainError } from './domain.error';

export class WorkOrderNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Ordem de serviço ${id} não encontrada`);
  }
}
