import { DomainError } from './domain.error';
import { EventEntityType } from '@/domain/types/entity-reference.type';

export class EventNotAllowedForEntityError extends DomainError {
  readonly statusCode = 400;

  constructor(eventTypeCode: string, entityType: EventEntityType) {
    super(`O tipo de evento ${eventTypeCode} não é permitido para a entidade ${entityType}`);
  }
}
