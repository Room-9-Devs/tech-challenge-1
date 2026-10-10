import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import { requireWorkOrder } from '../work-order-transaction.helpers';
import { ChangeWorkOrderItemInputDto } from './change-work-order-item-input.dto';
import { ChangeWorkOrderItemOutputDto } from './change-work-order-item-output.dto';

@Injectable()
export class ChangeWorkOrderItemUseCase {
  constructor(
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
  ) {}
  async execute(
    input: ChangeWorkOrderItemInputDto,
  ): Promise<ChangeWorkOrderItemOutputDto> {
    return this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      const item = order.items.find((i) => i.id === input.itemId);
      if (!item) throw new NotFoundException('Item não encontrado');
      if (item.productId) {
        if (!Number.isInteger(input.quantity))
          throw new BadRequestException(
            'A quantidade de produtos deve ser inteira',
          );
        const stock = await r.stocks.findByProductId(item.productId);
        const otherQuantity = order.items
          .filter(
            (i) => i.productId === item.productId && i.id !== input.itemId,
          )
          .reduce((n, i) => n + i.quantity, 0);
        if (!stock || stock.available < otherQuantity + input.quantity)
          throw new ConflictException('Saldo insuficiente em estoque');
      }
      order.changeItemQuantity(input.itemId, input.quantity);
      return r.workOrders.save(order);
    });
  }
}
