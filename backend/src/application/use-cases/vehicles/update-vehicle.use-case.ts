import { Inject, Injectable } from '@nestjs/common';
import { VehicleProps } from '@/domain/entities/vehicle.entity';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VEHICLE_REPOSITORY } from './create-vehicle/create-vehicle.use-case';
import { CreateVehicleOutputDto } from './create-vehicle/create-vehicle-output.dto';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { VehicleUpdatedEvent } from '@/domain/events/vehicle.events';

export type UpdateVehicleInput = Pick<VehicleProps, 'license_plate' | 'model' | 'brand' | 'year' | 'color'> & { id: string };

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: UpdateVehicleInput): Promise<CreateVehicleOutputDto> {
    const vehicle = await this.vehicles.findById(input.id);
    if (!vehicle) throw new VehicleNotFoundError(input.id);

    // Validate all fields before mutating the loaded entity.
    const normalizedPlate = input.license_plate?.trim().toUpperCase().replace('-', '');
    if (normalizedPlate !== vehicle.license_plate) {
      const duplicate = await this.vehicles.findByLicensePlate(normalizedPlate);
      if (duplicate && duplicate.id !== vehicle.id) throw new VehicleAlreadyExistsError(normalizedPlate);
    }
    const oldValues = {
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      brand: vehicle.brand,
      year: vehicle.year,
      color: vehicle.color,
    };

    vehicle.updateDetails(input);
    const saved = await this.vehicles.save(vehicle);

    await this.eventPublisher.publish(
      new VehicleUpdatedEvent(saved.id, {
        changedFields: Object.keys(input).filter((key) => key !== 'id'),
        old: oldValues,
        new: {
          license_plate: saved.license_plate,
          model: saved.model,
          brand: saved.brand,
          year: saved.year,
          color: saved.color,
        },
      }),
    );

    return {
      id: saved.id, user_id: saved.user_id, license_plate: saved.license_plate,
      model: saved.model, brand: saved.brand, year: saved.year, color: saved.color,
      createdAt: saved.createdAt, updatedAt: saved.updatedAt,
    };
  }
}
