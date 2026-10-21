import { Inject, Injectable } from '@nestjs/common';
import { InvalidWorkOrderError } from '@/domain/errors/invalid-work-order.error';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { VEHICLE_REPOSITORY } from '../../vehicles/create-vehicle/create-vehicle.use-case';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import {
  WORK_ORDER_NUMBER_GENERATOR,
  WorkOrderNumberGenerator,
} from '@/application/ports/work-order-number-generator.port';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { WorkOrderCreatedEvent } from '@/domain/events/work-order.events';
import { CreateWorkOrderInputDto } from './create-work-order-input.dto';
import { CreateWorkOrderOutputDto } from './create-work-order-output.dto';

@Injectable()
export class CreateWorkOrderUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
    @Inject(WORK_ORDER_NUMBER_GENERATOR)
    private readonly numbers: WorkOrderNumberGenerator,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    input: CreateWorkOrderInputDto,
  ): Promise<CreateWorkOrderOutputDto> {
    const vehicle = await this.vehicles.findById(input.vehicleId);
    if (!vehicle) throw new VehicleNotFoundError(input.vehicleId);
    if (!vehicle.user_id)
      throw new InvalidWorkOrderError('O veículo não possui cliente associado');
    const order = WorkOrder.create({
      number: await this.numbers.next(),
      vehicleId: vehicle.id,
      clientId: vehicle.user_id,
      createdBy: input.actor.id,
      observations: input.observations,
    });
    const saved = await this.uow.run(async (repositories) => {
      const saved = await repositories.workOrders.save(order);
      return saved;
    });
    await this.eventPublisher.publish(
      new WorkOrderCreatedEvent(
        saved.id,
        input.actor.username,
        'Ordem de serviço criada',
        { number: saved.number },
      ),
    );
    return saved;
  }
}
