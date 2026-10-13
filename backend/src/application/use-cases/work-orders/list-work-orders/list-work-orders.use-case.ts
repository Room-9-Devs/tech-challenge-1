import { Inject, Injectable } from '@nestjs/common';
import {
  WorkOrderQuery,
  WorkOrderRepository,
  WORK_ORDER_REPOSITORY,
} from '@/domain/repositories/work-order.repository';
import { ListWorkOrdersInputDto } from './list-work-orders-input.dto';
import { ListWorkOrdersOutputDto } from './list-work-orders-output.dto';

@Injectable()
export class ListWorkOrdersUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
  ) {}
  async execute(
    input: ListWorkOrdersInputDto,
  ): Promise<ListWorkOrdersOutputDto> {
    const query: WorkOrderQuery = { ...input.query };
    if (input.actor.entityType === 'client') query.clientId = input.actor.id;
    return this.orders.findAll(query);
  }
}
