import { Injectable, OnApplicationBootstrap, Inject } from '@nestjs/common';
import {
  VehicleCreatedEvent,
  VehicleUpdatedEvent,
  VehicleAssociatedToUserEvent,
  VehicleDissociatedFromUserEvent,
  VehicleDeletedEvent,
} from '@/domain/events/vehicle.events';
import { EVENT_RECORDER, EventRecorder } from '@/application/ports/event-recorder.port';
import {
  DOMAIN_EVENT_SUBSCRIBER,
  DomainEventSubscriber,
} from '@/application/ports/domain-event-subscriber.port';

@Injectable()
export class VehicleEventAuditHandler implements OnApplicationBootstrap {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
    @Inject(DOMAIN_EVENT_SUBSCRIBER)
    private readonly domainEventSubscriber: DomainEventSubscriber,
  ) {}

  onApplicationBootstrap(): void {
    this.domainEventSubscriber.on('vehicle.created', this.handleCreated.bind(this));
    this.domainEventSubscriber.on('vehicle.updated', this.handleUpdated.bind(this));
    this.domainEventSubscriber.on('vehicle.associated_to_user', this.handleAssociated.bind(this));
    this.domainEventSubscriber.on('vehicle.dissociated_from_user', this.handleDissociated.bind(this));
    this.domainEventSubscriber.on('vehicle.deleted', this.handleDeleted.bind(this));
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

  private async handleDeleted(event: VehicleDeletedEvent): Promise<void> {
    await this.eventRecorder.record({
      eventTypeCode: event.eventType,
      entityType: 'vehicle',
      entityId: event.entityId,
      createdBy: event.createdBy,
      metadata: event.metadata,
    });
  }
}
