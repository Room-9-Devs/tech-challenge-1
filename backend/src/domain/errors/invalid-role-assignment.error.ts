import { DomainError } from './domain.error';

export class InvalidRoleAssignmentError extends DomainError {
  readonly statusCode = 400;

  constructor(entityType: 'client' | 'employee', roleSlug: string) {
    super(`Role ${roleSlug} cannot be assigned to ${entityType} users`);
  }
}