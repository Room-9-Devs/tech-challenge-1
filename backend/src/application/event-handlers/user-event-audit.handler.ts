import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  UserCreatedEvent,
  UserUpdatedEvent,
  UserPasswordChangedEvent,
  UserRoleChangedEvent,
  UserDeletedEvent,
} from '@/domain/events/user.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

@Injectable()
export class UserEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('user.created', this.handleUserCreated.bind(this));
    this.domainEventSubscriber.on('user.updated', this.handleUserUpdated.bind(this));
    this.domainEventSubscriber.on('user.password_changed', this.handleUserPasswordChanged.bind(this));
    this.domainEventSubscriber.on('user.role_changed', this.handleUserRoleChanged.bind(this));
    this.domainEventSubscriber.on('user.deleted', this.handleUserDeleted.bind(this));
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUserPasswordChanged(event: UserPasswordChangedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
