import { DomainError } from './domain.error';

export class ServiceTypeNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Service type with id ${id} not found`);
  }
}
