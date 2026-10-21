import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { ClientCreatedEvent, ClientUpdatedEvent } from '@/domain/events/client.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

@Injectable()
export class ClientEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('client.created', this.handleCreated.bind(this));
    this.domainEventSubscriber.on('client.updated', this.handleUpdated.bind(this));
  }

  private async handleCreated(event: ClientCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'client',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUpdated(event: ClientUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'client',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
