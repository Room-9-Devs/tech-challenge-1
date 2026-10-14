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
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStatusChangedEvent } from '@/domain/events/work-order.events';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

// Política "Notificar Cliente": reage à mudança de status sem que o caso de uso conheça os e-mails.
@Injectable()
export class WorkOrderNotificationHandler implements OnApplicationBootstrap {
  private readonly logger = new Logger(WorkOrderNotificationHandler.name);

  private readonly notifications: Partial<
    Record<WorkOrderStatus, (order: WorkOrder) => Promise<void>>
  > = {
    [WorkOrderStatus.AWAITING_APPROVAL]: (order) =>
      this.notifier.notifyAwaitingApproval(order),
    [WorkOrderStatus.COMPLETED]: (order) =>
      this.notifier.notifyCompleted(order),
  };

  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(WORK_ORDER_NOTIFIER) private readonly notifier: WorkOrderNotifier,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on(
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
}
