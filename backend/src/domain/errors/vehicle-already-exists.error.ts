import { DomainError } from './domain.error';

export class VehicleAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(licensePlate: string) {
    super(`Vehicle with license plate ${licensePlate} already exists`);
  }
}
