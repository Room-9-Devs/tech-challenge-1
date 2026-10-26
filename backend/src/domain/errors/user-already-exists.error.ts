import { DomainError } from './domain.error';

export class UserAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(email: string) {
    super(`Já existe um usuário com o e-mail ${email}`);
  }
}
