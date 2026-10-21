import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import {
  EVENT_RECORDER,
  EventRecorder,
} from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';
import {
  WorkOrderCreatedEvent,
  WorkOrderItemAddedEvent,
  WorkOrderItemQuantityChangedEvent,
  WorkOrderItemRemovedEvent,
  WorkOrderPaymentConfirmedEvent,
  WorkOrderStatusChangedEvent,
} from '@/domain/events/work-order.events';

@Injectable()
export class WorkOrderEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER) private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('work_order.created', this.handle.bind(this));
    this.domainEventSubscriber.on(
      'work_order.status_changed',
      this.handle.bind(this),
    );
    this.domainEventSubscriber.on(
      'work_order.payment_confirmed',
      this.handle.bind(this),
    );
    this.domainEventSubscriber.on('work_order.item_added', this.handle.bind(this));
    this.domainEventSubscriber.on(
      'work_order.item_quantity_changed',
      this.handle.bind(this),
    );
    this.domainEventSubscriber.on(
      'work_order.item_removed',
      this.handle.bind(this),
    );
  }

  private async handle(
    event:
      | WorkOrderCreatedEvent
      | WorkOrderStatusChangedEvent
      | WorkOrderPaymentConfirmedEvent
      | WorkOrderItemAddedEvent
      | WorkOrderItemQuantityChangedEvent
      | WorkOrderItemRemovedEvent,
  ): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'work_order',
      entityId: event.entityId,
      createdBy: event.createdBy,
      note:
        event instanceof WorkOrderCreatedEvent ||
        event instanceof WorkOrderStatusChangedEvent ||
        event instanceof WorkOrderPaymentConfirmedEvent
          ? event.note
          : undefined,
      metadata: event.metadata,
    });
  }
}
