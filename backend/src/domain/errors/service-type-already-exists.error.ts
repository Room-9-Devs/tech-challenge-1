import { DomainError } from './domain.error';

export class ServiceTypeAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(description: string) {
    super(`Já existe um tipo de serviço com a descrição ${description}`);
  }
}
