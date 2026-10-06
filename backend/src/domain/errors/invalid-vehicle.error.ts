import { DomainError } from './domain.error';

export class InvalidVehicleError extends DomainError {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
