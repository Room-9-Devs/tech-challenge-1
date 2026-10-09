import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { EmployeeCreatedEvent, EmployeeUpdatedEvent } from '@/domain/events/employee.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

@Injectable()
export class EmployeeEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on('employee.created', this.handleCreated.bind(this));
    this.domainEventEmitter.on('employee.updated', this.handleUpdated.bind(this));
  }

  private async handleCreated(event: EmployeeCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'employee',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }

  private async handleUpdated(event: EmployeeUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'employee',
      entityId: event.entityId,
      metadata: event.metadata,
    });
  }
}
