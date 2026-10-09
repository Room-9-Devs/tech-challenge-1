import { EventEntityType } from '@/domain/types/entity-reference.type';
import { Event } from '@/domain/entities/event.entity';

export const EVENT_RECORDER = Symbol('EVENT_RECORDER');

export interface RecordEventInput {
  eventTypeCode: string;
  entityType: EventEntityType;
  entityId: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}

export interface EventRecorder {
  record(input: RecordEventInput): Promise<Event>;
}
