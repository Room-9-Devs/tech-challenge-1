import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { recordWorkOrderEvent } from '../work-order-transaction.helpers';
import { CreateWorkOrderInputDto } from './create-work-order-input.dto';
import { CreateWorkOrderOutputDto } from './create-work-order-output.dto';

@Injectable()
export class CreateWorkOrderUseCase {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
    @Inject(WORK_ORDER_NUMBER_GENERATOR)
    private readonly numbers: WorkOrderNumberGenerator,
  ) {}

  async execute(
    input: CreateWorkOrderInputDto,
  ): Promise<CreateWorkOrderOutputDto> {
    const vehicle = await this.vehicles.findById(input.vehicleId);
    if (!vehicle) throw new NotFoundException('Veículo não encontrado');
    if (!vehicle.user_id)
      throw new BadRequestException('O veículo não possui cliente associado');
    const order = WorkOrder.create({
      number: await this.numbers.next(),
      vehicleId: vehicle.id,
      clientId: vehicle.user_id,
      createdBy: input.actor.id,
      observations: input.observations,
    });
    return this.uow.run(async (repositories) => {
      const saved = await repositories.workOrders.save(order);
      await recordWorkOrderEvent(
        repositories,
        'work_order.created',
        saved,
        'Ordem de serviço criada',
        { number: saved.number },
        input.actor.username,
      );
      return saved;
    });
  }
}
