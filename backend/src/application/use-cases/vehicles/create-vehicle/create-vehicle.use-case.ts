import { Inject, Injectable } from '@nestjs/common';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { VehicleCreatedEvent } from '@/domain/events/vehicle.events';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { CreateVehicleInputDto } from './create-vehicle-input.dto';
import { CreateVehicleOutputDto } from './create-vehicle-output.dto';

export const VEHICLE_REPOSITORY = Symbol('VEHICLE_REPOSITORY');

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY)
    private readonly vehicleRepository: VehicleRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: CreateVehicleInputDto): Promise<CreateVehicleOutputDto> {
    const vehicle = Vehicle.create(input);
    const user = await this.userRepository.findById(vehicle.user_id);

    if (!user) {
      throw new UserNotFoundError(vehicle.user_id);
    }

    const existingVehicle = await this.vehicleRepository.findByLicensePlate(
      vehicle.license_plate,
    );

    if (existingVehicle) {
      throw new VehicleAlreadyExistsError(vehicle.license_plate);
    }

    const savedVehicle = await this.vehicleRepository.save(vehicle);

    await this.eventPublisher.publish(
      new VehicleCreatedEvent(savedVehicle.id, input.createdBy, {
        licensePlate: savedVehicle.license_plate,
        model: savedVehicle.model,
        brand: savedVehicle.brand,
        year: savedVehicle.year,
        color: savedVehicle.color,
      }),
    );

    return {
      id: savedVehicle.id,
      user_id: savedVehicle.user_id,
      license_plate: savedVehicle.license_plate,
      model: savedVehicle.model,
      brand: savedVehicle.brand,
      year: savedVehicle.year,
      color: savedVehicle.color,
      createdAt: savedVehicle.createdAt,
      updatedAt: savedVehicle.updatedAt,
    };
  }
}
