import { DomainEvent } from './domain-event';

export class UserCreatedEvent extends DomainEvent {
  readonly eventType = 'user.created';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { username: string; email: string; role: string },
  ) {
    super();
  }
}

export class UserUpdatedEvent extends DomainEvent {
  readonly eventType = 'user.updated';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { changedFields: string[]; old: Record<string, unknown>; new: Record<string, unknown> },
  ) {
    super();
  }
}

export class UserDeletedEvent extends DomainEvent {
  readonly eventType = 'user.deleted';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { username: string; email: string },
  ) {
    super();
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  readonly eventType = 'user.password_changed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { changedAt: string } = { changedAt: new Date().toISOString() },
  ) {
    super();
  }
}

export class UserRoleChangedEvent extends DomainEvent {
  readonly eventType = 'user.role_changed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { oldRole: string; newRole: string },
  ) {
    super();
  }
}
