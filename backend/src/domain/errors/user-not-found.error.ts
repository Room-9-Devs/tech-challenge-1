import { DomainError } from './domain.error';

export class UserNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Usuário ${id} não encontrado`);
  }
}
