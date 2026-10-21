import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import {
  WORK_ORDER_NOTIFIER,
  WorkOrderNotifier,
} from '@/application/ports/work-order-notifier.port';
import { IssueWorkOrderApprovalTokenUseCase } from '@/application/use-cases/work-order-approvals/issue-work-order-approval-token/issue-work-order-approval-token.use-case';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStatusChangedEvent } from '@/domain/events/work-order.events';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

// Política "Notificar Cliente": reage à mudança de status sem que o caso de uso conheça os e-mails.
@Injectable()
export class WorkOrderNotificationHandler implements OnApplicationBootstrap {
  private readonly logger = new Logger(WorkOrderNotificationHandler.name);

  private readonly notifications: Partial<
    Record<WorkOrderStatus, (order: WorkOrder) => Promise<void>>
  > = {
    [WorkOrderStatus.AWAITING_APPROVAL]: async (order) =>
      this.notifier.notifyAwaitingApproval(
        order,
        await this.issueApprovalToken(order),
      ),
    [WorkOrderStatus.COMPLETED]: (order) =>
      this.notifier.notifyCompleted(order),
  };

  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(WORK_ORDER_NOTIFIER) private readonly notifier: WorkOrderNotifier,
    @Inject(DOMAIN_EVENT_SUBSCRIBER) private readonly domainEventSubscriber: DomainEventSubscriber,
    private readonly issueWorkOrderApprovalToken: IssueWorkOrderApprovalTokenUseCase,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on(
      'work_order.status_changed',
      this.handle.bind(this),
    );
  }

  // O publisher aguarda os handlers: um erro aqui viraria 500 com o status já gravado.
  private async handle(event: WorkOrderStatusChangedEvent): Promise<void> {
    const notify = this.notifications[event.metadata.to];
    if (!notify) return;

    try {
      const order = await this.orders.findById(event.entityId);
      if (!order) {
        this.logger.warn(
          `OS ${event.entityId} não encontrada. Notificação não enviada.`,
        );
        return;
      }

      await notify(order);
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Falha ao notificar a mudança de status da OS ${event.entityId}: ${failure.message}`,
        failure.stack,
      );
    }
  }

  // Sem token o e-mail ainda sai, só que sem os links: o cliente pode decidir pelo sistema.
  private async issueApprovalToken(
    order: WorkOrder,
  ): Promise<string | undefined> {
    try {
      return await this.issueWorkOrderApprovalToken.execute(order);
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Falha ao gerar o link de aprovação da ${order.number}: ${failure.message}`,
        failure.stack,
      );
      return undefined;
    }
  }
}
