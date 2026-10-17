import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  StockAdjustedEvent,
  StockConsumedEvent,
  StockReservedEvent,
  StockReleasedEvent,
} from '@/domain/events/stock.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

@Injectable()
export class StockEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on('stock.adjusted', this.handleAdjusted.bind(this));
    this.domainEventEmitter.on('stock.reserved', this.handleReserved.bind(this));
    this.domainEventEmitter.on('stock.consumed', this.handleConsumed.bind(this));
    this.domainEventEmitter.on('stock.released', this.handleReleased.bind(this));
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
