import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import { requireWorkOrder } from '../work-order-transaction.helpers';
import { RemoveWorkOrderItemInputDto } from './remove-work-order-item-input.dto';
import { RemoveWorkOrderItemOutputDto } from './remove-work-order-item-output.dto';

@Injectable()
export class RemoveWorkOrderItemUseCase {
  constructor(
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
  ) {}
  async execute(
    input: RemoveWorkOrderItemInputDto,
  ): Promise<RemoveWorkOrderItemOutputDto> {
    return this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      if (!order.removeItem(input.itemId))
        throw new NotFoundException('Item não encontrado');
      await r.workOrders.deleteItem(input.id, input.itemId);
      return r.workOrders.save(order);
    });
  }
}
