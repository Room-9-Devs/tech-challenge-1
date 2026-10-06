import { Inject, Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VEHICLE_REPOSITORY } from './create-vehicle/create-vehicle.use-case';

@Injectable()
export class DeleteVehicleUseCase {
  constructor(@Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.vehicles.findById(id))) throw new VehicleNotFoundError(id);
    await this.vehicles.delete(id);
  }
}
