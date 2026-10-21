import { Inject, Injectable } from '@nestjs/common';
import { WorkOrderAccessDeniedError } from '@/domain/errors/work-order-access-denied.error';
import { WorkOrderNotFoundError } from '@/domain/errors/work-order-not-found.error';
import { VEHICLE_REPOSITORY } from '../../vehicles/create-vehicle/create-vehicle.use-case';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { USER_REPOSITORY } from '../../users/create-user/create-user.use-case';
import { UserRepository } from '@/domain/repositories/user.repository';
import {
  PROFILE_REPOSITORY,
  ProfileRepository,
} from '@/application/ports/profile.repository';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import { FindWorkOrderInputDto } from './find-work-order-input.dto';
import { FindWorkOrderOutputDto } from './find-work-order-output.dto';

@Injectable()
export class FindWorkOrderUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(VEHICLE_REPOSITORY) private readonly vehicles: VehicleRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
  ) {}
  async execute(input: FindWorkOrderInputDto): Promise<FindWorkOrderOutputDto> {
    const order = await this.orders.findById(input.id);
    if (!order) throw new WorkOrderNotFoundError(input.id);
    if (
      input.actor.entityType === 'client' &&
      order.clientId !== input.actor.id
    ) {
      throw new WorkOrderAccessDeniedError();
    }
    const [vehicle, client] = await Promise.all([
      this.vehicles.findById(order.vehicleId),
      this.users.findById(order.clientId),
    ]);
    const profile = client
      ? await this.profiles.findById('client', client.entityId)
      : null;
    return { order, vehicle, client, profile };
  }
}
