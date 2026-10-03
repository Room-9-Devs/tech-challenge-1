import { Inject, Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VEHICLE_REPOSITORY } from '../create-vehicle/create-vehicle.use-case';
import { FindVehicleInputDto } from './find-vehicle-input.dto';
import { FindVehicleOutputDto } from './find-vehicle-output.dto';

@Injectable()
export class FindVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async execute(input: FindVehicleInputDto): Promise<FindVehicleOutputDto> {
    const vehicle = await this.vehicleRepository.findById(input.id);

    if (!vehicle) {
      throw new VehicleNotFoundError(input.id);
    }

    return {
      id: vehicle.id,
      user_id: vehicle.user_id,
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
      color: vehicle.color,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
