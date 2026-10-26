import { DomainError } from './domain.error';

export class VehicleAlreadyExistsError extends DomainError {
  readonly statusCode = 409;

  constructor(licensePlate: string) {
    super(`Já existe um veículo com a placa ${licensePlate}`);
  }
}
