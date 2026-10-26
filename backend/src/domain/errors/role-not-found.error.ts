import { DomainError } from './domain.error';

export class RoleNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(slug: string) {
    super(`Role ${slug} não encontrada`);
  }
}