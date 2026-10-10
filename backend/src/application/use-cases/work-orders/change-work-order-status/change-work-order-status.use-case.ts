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
  EMAIL_SENDER,
  EmailSender,
} from '@/application/ports/email-sender.port';
import { USER_REPOSITORY } from '../../users/create-user/create-user.use-case';
import { UserRepository } from '@/domain/repositories/user.repository';
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
  recordWorkOrderEvent,
  reserveWorkOrderProducts,
} from '../work-order-transaction.helpers';
import { ChangeWorkOrderStatusInputDto } from './change-work-order-status-input.dto';
import { ChangeWorkOrderStatusOutputDto } from './change-work-order-status-output.dto';

@Injectable()
export class ChangeWorkOrderStatusUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(WORK_ORDER_UNIT_OF_WORK) private readonly uow: WorkOrderUnitOfWork,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
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
    const saved = await this.uow.run(async (r) => {
      const current = await r.workOrders.findById(input.id);
      if (!current)
        throw new NotFoundException('Ordem de serviço não encontrada');
      const previous = current.status;
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
      await recordWorkOrderEvent(
        r,
        'work_order.status_changed',
        updated,
        input.note,
        { from: previous, to: input.status, reason: input.note },
        input.actor.username,
      );
      return updated;
    });
    if (
      input.status === WorkOrderStatus.AWAITING_APPROVAL ||
      input.status === WorkOrderStatus.COMPLETED
    ) {
      const client = await this.users.findById(saved.clientId);
      if (client) {
        const isQuote = input.status === WorkOrderStatus.AWAITING_APPROVAL;
        const message = isQuote
          ? `O orçamento da ordem ${saved.number} está disponível para aprovação. Total: R$ ${saved.totalPrice.toFixed(2)}.`
          : `O serviço da ordem ${saved.number} foi concluído.`;
        await this.email.send({
          to: client.email,
          subject: isQuote
            ? `Orçamento disponível - ${saved.number}`
            : `Serviço concluído - ${saved.number}`,
          text: message,
          html: `<p>${message}</p>`,
        });
      }
    }
    return saved;
  }
}
