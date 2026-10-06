import { DomainError } from './domain.error';

export class DocumentAlreadyExistsError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('A profile with this CPF/CNPJ already exists');
  }
}
