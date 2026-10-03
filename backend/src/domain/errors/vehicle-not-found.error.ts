import { DomainError } from './domain.error';

export class VehicleNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(id: string) {
    super(`Vehicle with id ${id} not found`);
  }
}
