import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  VehicleCreatedEvent,
  VehicleUpdatedEvent,
  VehicleAssociatedToUserEvent,
  VehicleDissociatedFromUserEvent,
} from '@/domain/events/vehicle.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

@Injectable()
export class VehicleEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    private readonly domainEventEmitter: DomainEventEmitter,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventEmitter.on('vehicle.created', this.handleCreated.bind(this));
    this.domainEventEmitter.on('vehicle.updated', this.handleUpdated.bind(this));
    this.domainEventEmitter.on('vehicle.associated_to_user', this.handleAssociated.bind(this));
    this.domainEventEmitter.on('vehicle.dissociated_from_user', this.handleDissociated.bind(this));
  }

  private async handleCreated(event: VehicleCreatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'vehicle',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleUpdated(event: VehicleUpdatedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'vehicle',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleAssociated(event: VehicleAssociatedToUserEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'vehicle',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }

  private async handleDissociated(event: VehicleDissociatedFromUserEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'vehicle',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
