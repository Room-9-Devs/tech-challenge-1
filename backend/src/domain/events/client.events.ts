import { DomainEvent } from './domain-event';
import { DocumentType } from '@/domain/types';

export class ClientCreatedEvent extends DomainEvent {
  readonly eventType = 'client.created';

  constructor(
    readonly entityId: string,
    readonly metadata: { name: string; documentType: DocumentType; document: string },
  ) {
    super();
  }
}

export class ClientUpdatedEvent extends DomainEvent {
  readonly eventType = 'client.updated';

  constructor(
    readonly entityId: string,
    readonly metadata: { changedFields: string[]; old: Record<string, unknown>; new: Record<string, unknown> },
  ) {
    super();
  }
}
