import { DomainError } from './domain.error';
import { EventEntityType } from '@/domain/types/entity-reference.type';

export class EventNotAllowedForEntityError extends DomainError {
  readonly statusCode = 400;

  constructor(eventTypeCode: string, entityType: EventEntityType) {
    super(`Event type ${eventTypeCode} is not allowed for entity type ${entityType}`);
  }
}
