import { Inject, Injectable } from '@nestjs/common';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { InsufficientStockError } from '@/domain/errors/insufficient-stock.error';
import { InvalidWorkOrderItemError } from '@/domain/errors/invalid-work-order-item.error';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { WorkOrderItemAddedEvent } from '@/domain/events/work-order.events';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import { requireWorkOrder } from '../work-order-transaction.helpers';
import { AddWorkOrderItemInputDto } from './add-work-order-item-input.dto';
import { AddWorkOrderItemOutputDto } from './add-work-order-item-output.dto';

@Injectable()
export class AddWorkOrderItemUseCase {
  constructor(
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}
  async execute(
    input: AddWorkOrderItemInputDto,
  ): Promise<AddWorkOrderItemOutputDto> {
    const result = await this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      const hasService = Boolean(input.serviceId),
        hasProduct = Boolean(input.productId);
      if (hasService === hasProduct)
        throw new InvalidWorkOrderItemError(
          'Informe exatamente um serviço ou produto',
        );
      let unitPrice: number;
      if (input.serviceId) {
        const service = await r.repairs.findById(input.serviceId);
        if (!service) throw new RepairNotFoundError(input.serviceId);
        unitPrice = service.unitValue;
      } else {
        const product = await r.products.findById(input.productId!);
        if (!product || !product.active)
          throw new ProductNotFoundError(input.productId!);
        if (!Number.isInteger(input.quantity))
          throw new InvalidWorkOrderItemError(
            'A quantidade de produtos deve ser inteira',
          );
        const stock = await r.stocks.findByProductId(product.id);
        const currentQty = order.items
          .filter((i) => i.productId === product.id)
          .reduce((n, i) => n + i.quantity, 0);
        if (!stock || stock.available < currentQty + input.quantity)
          throw new InsufficientStockError(
            product.id,
            stock?.available ?? 0,
            currentQty + input.quantity,
          );
        unitPrice = product.salePrice;
      }
      const item = WorkOrderItem.create({
        serviceId: input.serviceId,
        productId: input.productId,
        quantity: input.quantity,
        unitPrice,
      });
      order.addItem(item);
      return { order: await r.workOrders.save(order), item };
    });
    const { item } = result;
    await this.eventPublisher.publish(
      new WorkOrderItemAddedEvent(result.order.id, input.actor.username, {
        itemId: item.id,
        itemType: item.serviceId ? 'service' : 'product',
        serviceId: item.serviceId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }),
    );
    return result.order;
  }
}
