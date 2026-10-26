import { DomainError } from './domain.error';

export class WorkOrderItemNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(itemId: string) {
    super(`Item ${itemId} não encontrado na ordem de serviço`);
  }
}
