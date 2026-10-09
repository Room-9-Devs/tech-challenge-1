import { EventEntityType } from '@/domain/types/entity-reference.type';

export class EventNotAllowedForEntityError extends Error {
  constructor(eventTypeCode: string, entityType: EventEntityType) {
    super(`Event type ${eventTypeCode} is not allowed for entity type ${entityType}`);
    this.name = 'EventNotAllowedForEntityError';
  }
}
