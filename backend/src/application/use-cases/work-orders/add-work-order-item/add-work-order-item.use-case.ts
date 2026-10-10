import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
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
  ) {}
  async execute(
    input: AddWorkOrderItemInputDto,
  ): Promise<AddWorkOrderItemOutputDto> {
    return this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      const hasService = Boolean(input.serviceId),
        hasProduct = Boolean(input.productId);
      if (hasService === hasProduct)
        throw new BadRequestException(
          'Informe exatamente um serviço ou produto',
        );
      let unitPrice: number;
      if (input.serviceId) {
        const service = await r.repairs.findById(input.serviceId);
        if (!service) throw new NotFoundException('Serviço não encontrado');
        unitPrice = service.unitValue;
      } else {
        const product = await r.products.findById(input.productId!);
        if (!product || !product.active)
          throw new NotFoundException('Produto não encontrado ou inativo');
        if (!Number.isInteger(input.quantity))
          throw new BadRequestException(
            'A quantidade de produtos deve ser inteira',
          );
        const stock = await r.stocks.findByProductId(product.id);
        const currentQty = order.items
          .filter((i) => i.productId === product.id)
          .reduce((n, i) => n + i.quantity, 0);
        if (!stock || stock.available < currentQty + input.quantity)
          throw new ConflictException('Saldo insuficiente em estoque');
        unitPrice = product.salePrice;
      }
      order.addItem(
        WorkOrderItem.create({
          serviceId: input.serviceId,
          productId: input.productId,
          quantity: input.quantity,
          unitPrice,
        }),
      );
      return r.workOrders.save(order);
    });
  }
}
