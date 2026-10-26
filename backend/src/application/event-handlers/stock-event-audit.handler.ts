import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  StockAdjustedEvent,
  StockConsumedEvent,
  StockReservedEvent,
  StockReleasedEvent,
} from '@/domain/events/stock.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

@Injectable()
export class StockEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('stock.adjusted', this.handleAdjusted.bind(this));
    this.domainEventSubscriber.on('stock.reserved', this.handleReserved.bind(this));
    this.domainEventSubscriber.on('stock.consumed', this.handleConsumed.bind(this));
    this.domainEventSubscriber.on('stock.released', this.handleReleased.bind(this));
  }

  private async handleAdjusted(event: StockAdjustedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'stock',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleReserved(event: StockReservedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'stock',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleConsumed(event: StockConsumedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'stock',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleReleased(event: StockReleasedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'stock',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
