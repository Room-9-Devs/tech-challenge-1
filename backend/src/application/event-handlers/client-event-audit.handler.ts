import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { ClientCreatedEvent, ClientUpdatedEvent } from '@/domain/events/client.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

@Injectable()
export class ClientEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on('client.created', this.handleCreated.bind(this));
    this.domainEventEmitter.on('client.updated', this.handleUpdated.bind(this));
  }

  private async handleCreated(event: ClientCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'client',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleUpdated(event: ClientUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'client',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }
}
