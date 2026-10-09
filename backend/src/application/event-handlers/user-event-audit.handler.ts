import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserPasswordChangedEvent,
  UserRoleChangedEvent,
} from '@/domain/events/user.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

@Injectable()
export class UserEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on('user.created', this.handleUserCreated.bind(this));
    this.domainEventEmitter.on('user.updated', this.handleUserUpdated.bind(this));
    this.domainEventEmitter.on('user.password_changed', this.handleUserPasswordChanged.bind(this));
    this.domainEventEmitter.on('user.role_changed', this.handleUserRoleChanged.bind(this));
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleUserPasswordChanged(event: UserPasswordChangedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }
}
