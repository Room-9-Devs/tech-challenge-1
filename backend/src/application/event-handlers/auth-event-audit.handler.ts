import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  AuthLoginSucceededEvent,
  AuthLoginFailedEvent,
  AuthLogoutSucceededEvent,
} from '@/domain/events/auth.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

@Injectable()
export class AuthEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on('auth.login.succeeded', this.handleLoginSucceeded.bind(this));
    this.domainEventEmitter.on('auth.login.failed', this.handleLoginFailed.bind(this));
    this.domainEventEmitter.on('auth.logout.succeeded', this.handleLogoutSucceeded.bind(this));
  }

  private async handleLoginSucceeded(event: AuthLoginSucceededEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleLoginFailed(event: AuthLoginFailedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleLogoutSucceeded(event: AuthLogoutSucceededEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'user',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }
}
