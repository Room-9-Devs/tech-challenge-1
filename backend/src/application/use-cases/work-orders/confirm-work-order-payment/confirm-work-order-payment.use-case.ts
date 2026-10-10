import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import {
  recordWorkOrderEvent,
  requireWorkOrder,
} from '../work-order-transaction.helpers';
import { ConfirmWorkOrderPaymentInputDto } from './confirm-work-order-payment-input.dto';
import { ConfirmWorkOrderPaymentOutputDto } from './confirm-work-order-payment-output.dto';

@Injectable()
export class ConfirmWorkOrderPaymentUseCase {
  constructor(
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
  ) {}
  async execute(
    input: ConfirmWorkOrderPaymentInputDto,
  ): Promise<ConfirmWorkOrderPaymentOutputDto> {
    return this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      if (order.status !== WorkOrderStatus.APPROVED)
        throw new ConflictException(
          'Pagamento só pode ser confirmado após a aprovação do orçamento',
        );
      const existing = await r.events.findByEntity('work_order', input.id);
      if (existing.some((e) => e.metadata?.kind === 'payment_confirmation'))
        throw new ConflictException('Pagamento já confirmado');
      await recordWorkOrderEvent(
        r,
        'work_order.payment_confirmed',
        order,
        input.note ?? 'Pagamento confirmado manualmente',
        { kind: 'payment_confirmation' },
        input.actor.username,
      );
      return { workOrderId: input.id, confirmed: true };
    });
  }
}
