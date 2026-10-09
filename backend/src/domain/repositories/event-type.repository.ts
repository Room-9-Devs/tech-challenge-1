import { EventType } from '@/domain/entities/event-type.entity';

export const EVENT_TYPE_REPOSITORY = Symbol('EVENT_TYPE_REPOSITORY');

export interface EventTypeRepository {
  save(eventType: EventType): Promise<EventType>;
  findById(id: string): Promise<EventType | null>;
  findByCode(code: string): Promise<EventType | null>;
  findAll(): Promise<EventType[]>;
  delete(id: string): Promise<void>;
}
