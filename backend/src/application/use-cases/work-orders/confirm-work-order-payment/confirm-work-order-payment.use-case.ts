import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { WorkOrderPaymentConfirmedEvent } from '@/domain/events/work-order.events';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import { requireWorkOrder } from '../work-order-transaction.helpers';
import { ConfirmWorkOrderPaymentInputDto } from './confirm-work-order-payment-input.dto';
import { ConfirmWorkOrderPaymentOutputDto } from './confirm-work-order-payment-output.dto';

@Injectable()
export class ConfirmWorkOrderPaymentUseCase {
  constructor(
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}
  async execute(
    input: ConfirmWorkOrderPaymentInputDto,
  ): Promise<ConfirmWorkOrderPaymentOutputDto> {
    const result = await this.uow.run(async (r) => {
      const order = await requireWorkOrder(r, input.id);
      if (order.status !== WorkOrderStatus.APPROVED)
        throw new ConflictException(
          'Pagamento só pode ser confirmado após a aprovação do orçamento',
        );
      const existing = await r.events.findByEntity('work_order', input.id);
      if (existing.some((e) => e.metadata?.kind === 'payment_confirmation'))
        throw new ConflictException('Pagamento já confirmado');
      return { workOrderId: input.id, confirmed: true as const };
    });
    await this.eventPublisher.publish(
      new WorkOrderPaymentConfirmedEvent(
        result.workOrderId,
        input.actor.username,
        input.note ?? 'Pagamento confirmado manualmente',
        { kind: 'payment_confirmation' },
      ),
    );
    return result;
  }
}
