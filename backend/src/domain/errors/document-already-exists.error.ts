import { DomainError } from './domain.error';

export class DocumentAlreadyExistsError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('Já existe um perfil com este CPF/CNPJ');
  }
}
