import { DomainError } from './domain.error';

export class WorkOrderConflictError extends DomainError {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
  }
}
