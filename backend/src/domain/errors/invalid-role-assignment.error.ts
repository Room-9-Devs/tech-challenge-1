import { DomainError } from './domain.error';

export class InvalidRoleAssignmentError extends DomainError {
  readonly statusCode = 400;

  constructor(entityType: 'client' | 'employee', roleSlug: string) {
    super(`A role ${roleSlug} não pode ser atribuída a usuários do tipo ${entityType}`);
  }
}