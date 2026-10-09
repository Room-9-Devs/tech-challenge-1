import { DomainEvent } from './domain-event';

export class RepairCreatedEvent extends DomainEvent {
  readonly eventType = 'repair.created';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { description: string; unitValue: number },
  ) {
    super();
  }
}

export class RepairUpdatedEvent extends DomainEvent {
  readonly eventType = 'repair.updated';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { changedFields: string[]; old: Record<string, unknown>; new: Record<string, unknown> },
  ) {
    super();
  }
}

export class RepairDeletedEvent extends DomainEvent {
  readonly eventType = 'repair.deleted';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { description: string; unitValue: number },
  ) {
    super();
  }
}
