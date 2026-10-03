import { Inject, Injectable } from '@nestjs/common';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VEHICLE_REPOSITORY } from '../create-vehicle/create-vehicle.use-case';
import { ListVehiclesOutputDto } from './list-vehicles-output.dto';

@Injectable()
export class ListVehiclesUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async execute(): Promise<ListVehiclesOutputDto> {
    const vehicles = await this.vehicleRepository.findAll();

    return {
      vehicles: vehicles.map((vehicle) => ({
        id: vehicle.id,
        user_id: vehicle.user_id,
        license_plate: vehicle.license_plate,
        model: vehicle.model,
        brand: vehicle.brand,
        year: vehicle.year,
        color: vehicle.color,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      })),
    };
  }
}
