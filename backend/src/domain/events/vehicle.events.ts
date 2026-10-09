import { DomainEvent } from './domain-event';

export class VehicleCreatedEvent extends DomainEvent {
  readonly eventType = 'vehicle.created';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { licensePlate: string; model: string; brand: string; year: number; color: string },
  ) {
    super();
  }
}

export class VehicleUpdatedEvent extends DomainEvent {
  readonly eventType = 'vehicle.updated';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { changedFields: string[]; old: Record<string, unknown>; new: Record<string, unknown> },
  ) {
    super();
  }
}

export class VehicleAssociatedToUserEvent extends DomainEvent {
  readonly eventType = 'vehicle.associated_to_user';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { userId: string },
  ) {
    super();
  }
}

export class VehicleDissociatedFromUserEvent extends DomainEvent {
  readonly eventType = 'vehicle.dissociated_from_user';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { userId: string },
  ) {
    super();
  }
}
