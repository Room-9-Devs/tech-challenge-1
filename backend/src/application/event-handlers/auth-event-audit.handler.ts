import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  AuthLoginSucceededEvent,
  AuthLoginFailedEvent,
  AuthLogoutSucceededEvent,
} from '@/domain/events/auth.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

@Injectable()
export class AuthEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('auth.login.succeeded', this.handleLoginSucceeded.bind(this));
    this.domainEventSubscriber.on('auth.login.failed', this.handleLoginFailed.bind(this));
    this.domainEventSubscriber.on('auth.logout.succeeded', this.handleLogoutSucceeded.bind(this));
  }

  private async handleLoginSucceeded(event: AuthLoginSucceededEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleLoginFailed(event: AuthLoginFailedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleLogoutSucceeded(event: AuthLogoutSucceededEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
