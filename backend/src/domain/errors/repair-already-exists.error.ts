import { DomainError } from './domain.error';

export class RepairAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(description: string) {
    super(`Já existe um reparo/serviço com a descrição "${description}"`);
  }
}
