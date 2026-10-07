import { Inject, Injectable } from '@nestjs/common';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VEHICLE_REPOSITORY } from '../create-vehicle/create-vehicle.use-case';
import { ListVehiclesInputDto } from './list-vehicles-input.dto';
import { ListVehiclesOutputDto } from './list-vehicles-output.dto';

@Injectable()
export class ListVehiclesUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: VehicleRepository,
  ) {}

  async execute(
    input: ListVehiclesInputDto = {},
  ): Promise<ListVehiclesOutputDto> {
    const { filters, ...paginationQuery } = input;

    const { data, meta } = await this.vehicleRepository.findAll({
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      search: paginationQuery.search,
      sort: paginationQuery.sort,
      filters,
    });

    return {
      data: data.map((vehicle) => ({
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
      meta,
    };
  }
}
