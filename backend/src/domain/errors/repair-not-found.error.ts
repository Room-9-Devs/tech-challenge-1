import { DomainError } from './domain.error';

export class RepairNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Reparo/serviço com id ${id} não encontrado`);
  }
}
