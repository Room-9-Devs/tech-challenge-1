import { DomainEvent } from './domain-event';
import { DocumentType } from '@/domain/types';

export class EmployeeCreatedEvent extends DomainEvent {
  readonly eventType = 'employee.created';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { name: string; documentType: DocumentType; document: string; jobTitle?: string },
  ) {
    super();
  }
}

export class EmployeeUpdatedEvent extends DomainEvent {
  readonly eventType = 'employee.updated';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { changedFields: string[]; old: Record<string, unknown>; new: Record<string, unknown> },
  ) {
    super();
  }
}
