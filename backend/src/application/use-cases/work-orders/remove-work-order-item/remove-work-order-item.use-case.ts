import { Inject, Injectable } from '@nestjs/common';
import { WorkOrderItemNotFoundError } from '@/domain/errors/work-order-item-not-found.error';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { WorkOrderItemRemovedEvent } from '@/domain/events/work-order.events';
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
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}
  async execute(
    input: RemoveWorkOrderItemInputDto,
  ): Promise<RemoveWorkOrderItemOutputDto> {
    const result = await this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      const item = order.items.find((existing) => existing.id === input.itemId);
      if (!item) throw new WorkOrderItemNotFoundError(input.itemId);
      if (!order.removeItem(input.itemId))
        throw new WorkOrderItemNotFoundError(input.itemId);
      await r.workOrders.deleteItem(input.id, input.itemId);
      return { order: await r.workOrders.save(order), item };
    });
    await this.eventPublisher.publish(
      new WorkOrderItemRemovedEvent(result.order.id, input.actor.username, {
        itemId: result.item.id,
        itemType: result.item.serviceId ? 'service' : 'product',
        serviceId: result.item.serviceId,
        productId: result.item.productId,
        quantity: result.item.quantity,
        unitPrice: result.item.unitPrice,
      }),
    );
    return result.order;
  }
}
