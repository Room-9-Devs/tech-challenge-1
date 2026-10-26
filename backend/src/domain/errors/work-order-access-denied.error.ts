import { DomainError } from './domain.error';

export class WorkOrderAccessDeniedError extends DomainError {
  readonly statusCode = 403;

  constructor(message = 'Você não tem acesso a esta ordem de serviço') {
    super(message);
  }
}
