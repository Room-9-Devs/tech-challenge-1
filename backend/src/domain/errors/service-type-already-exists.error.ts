import { DomainError } from './domain.error';

export class ServiceTypeAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(description: string) {
    super(`Service type with description ${description} already exists`);
  }
}
