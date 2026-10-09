import { Event } from '@/domain/entities/event.entity';
import { EventEntityType } from '@/domain/types/entity-reference.type';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

export interface EventRepository {
  save(event: Event): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findByEntity(entityType: EventEntityType, entityId: string): Promise<Event[]>;
  findByEventType(eventTypeId: string): Promise<Event[]>;
}
