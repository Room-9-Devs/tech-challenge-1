import { Inject, Injectable } from '@nestjs/common';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { VehicleDeletedEvent } from '@/domain/events/vehicle.events';
import { VEHICLE_REPOSITORY } from './create-vehicle/create-vehicle.use-case';

@Injectable()
export class DeleteVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(id: string, createdBy?: string): Promise<void> {
    const vehicle = await this.vehicles.findById(id);
    if (!vehicle) throw new VehicleNotFoundError(id);
    await this.vehicles.delete(id);

    await this.eventPublisher.publish(
      new VehicleDeletedEvent(vehicle.id, createdBy, {
        licensePlate: vehicle.license_plate,
      }),
    );
  }
}
