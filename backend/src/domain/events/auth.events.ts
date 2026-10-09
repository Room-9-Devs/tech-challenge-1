import { DomainEvent } from './domain-event';

export class AuthLoginSucceededEvent extends DomainEvent {
  readonly eventType = 'auth.login.succeeded';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { ip?: string; userAgent?: string },
  ) {
    super();
  }
}

export class AuthLoginFailedEvent extends DomainEvent {
  readonly eventType = 'auth.login.failed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { username: string; reason: string },
  ) {
    super();
  }
}

export class AuthLogoutSucceededEvent extends DomainEvent {
  readonly eventType = 'auth.logout.succeeded';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { userId: string },
  ) {
    super();
  }
}
