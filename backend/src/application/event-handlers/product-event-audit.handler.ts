import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductPriceChangedEvent,
} from '@/domain/events/product.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

@Injectable()
export class ProductEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('product.created', this.handleCreated.bind(this));
    this.domainEventSubscriber.on('product.updated', this.handleUpdated.bind(this));
    this.domainEventSubscriber.on('product.price_changed', this.handlePriceChanged.bind(this));
  }

  private async handleCreated(event: ProductCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'product',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUpdated(event: ProductUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'product',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handlePriceChanged(event: ProductPriceChangedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'product',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
