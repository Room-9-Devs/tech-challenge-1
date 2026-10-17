import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { WorkOrderStatusChangedEvent } from '@/domain/events/work-order.events';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import {
  WORK_ORDER_UNIT_OF_WORK,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import {
  finishWorkOrderReservation,
  reserveWorkOrderProducts,
} from '../work-order-transaction.helpers';
import { ChangeWorkOrderStatusInputDto } from './change-work-order-status-input.dto';
import { ChangeWorkOrderStatusOutputDto } from './change-work-order-status-output.dto';

@Injectable()
export class ChangeWorkOrderStatusUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}
  async execute(
    input: ChangeWorkOrderStatusInputDto,
  ): Promise<ChangeWorkOrderStatusOutputDto> {
    if (!input.note?.trim())
      throw new BadRequestException('O motivo da alteração é obrigatório');
    const order = await this.orders.findById(input.id);
    if (!order) throw new NotFoundException('Ordem de serviço não encontrada');
    const isClientDecision =
      input.actor.entityType === 'client' &&
      order.clientId === input.actor.id &&
      order.status === WorkOrderStatus.AWAITING_APPROVAL &&
      [WorkOrderStatus.APPROVED, WorkOrderStatus.CANCELLED].includes(
        input.status,
      );
    if (input.actor.entityType === 'client' && !isClientDecision) {
      throw new ForbiddenException(
        'Cliente só pode aprovar ou recusar o orçamento da própria OS',
      );
    }
    let previousStatus: WorkOrderStatus | undefined;
    const saved = await this.uow.run(async (r) => {
      const current = await r.workOrders.findById(input.id);
      if (!current)
        throw new NotFoundException('Ordem de serviço não encontrada');
      const previous = current.status;
      previousStatus = previous;
      // A OS está travada (pessimistic_write): um segundo clique concorrente encontra o token já usado.
      if (
        input.approvalTokenId &&
        !(await r.approvalTokens.markUsed(input.approvalTokenId))
      ) {
        throw new WorkOrderApprovalLinkInvalidError();
      }
      if (input.status === WorkOrderStatus.IN_PROGRESS) {
        const events = await r.events.findByEntity('work_order', input.id);
        if (!events.some((e) => e.metadata?.kind === 'payment_confirmation')) {
          throw new ConflictException(
            'Confirme o pagamento antes de iniciar o serviço',
          );
        }
      }
      if (input.status === WorkOrderStatus.AWAITING_APPROVAL)
        await reserveWorkOrderProducts(r, current, input.actor.username);
      if (
        input.status === WorkOrderStatus.APPROVED ||
        input.status === WorkOrderStatus.CANCELLED
      ) {
        await finishWorkOrderReservation(
          r,
          current,
          input.status,
          input.actor.id,
          input.actor.username,
        );
      }
      current.changeStatus(input.status);
      const updated = await r.workOrders.save(current);
      // Decidido por qualquer caminho (link, app ou equipe), os links do e-mail deixam de valer.
      if (previous === WorkOrderStatus.AWAITING_APPROVAL)
        await r.approvalTokens.revokeAllByWorkOrder(current.id);
      return updated;
    });
    await this.eventPublisher.publish(
      new WorkOrderStatusChangedEvent(
        saved.id,
        input.actor.username,
        input.note,
        {
          from: previousStatus!,
          to: input.status,
          reason: input.note,
        },
      ),
    );
    return saved;
  }
}
