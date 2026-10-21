import { randomUUID } from 'crypto';
import { EventEntityType, EVENT_ENTITY_TYPES } from '@/domain/types/entity-reference.type';
import { InvalidEventError } from '../errors/invalid-event.error';

export interface EventProps {
  id?: string;
  eventTypeId: string;
  entityType: EventEntityType;
  entityId: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt?: Date;
}

export class Event {
  private readonly _id: string;
  private readonly _eventTypeId: string;
  private readonly _entityType: EventEntityType;
  private readonly _entityId: string;
  private readonly _note: string | null;
  private readonly _metadata: Record<string, unknown> | null;
  private readonly _createdBy: string | null;
  private readonly _createdAt: Date;

  private constructor(props: EventProps) {
    this._id = props.id ?? randomUUID();
    this._eventTypeId = props.eventTypeId;
    this._entityType = props.entityType;
    this._entityId = props.entityId;
    this._note = props.note ?? null;
    this._metadata = props.metadata ?? null;
    this._createdBy = props.createdBy ?? null;
    this._createdAt = props.createdAt ?? new Date();
  }

  public static create(props: EventProps): Event {
    Event.validate(props);
    return new Event(props);
  }

  public static reconstitute(props: EventProps): Event {
    return new Event(props);
  }

  get id(): string { return this._id; }
  get eventTypeId(): string { return this._eventTypeId; }
  get entityType(): EventEntityType { return this._entityType; }
  get entityId(): string { return this._entityId; }
  get note(): string | null { return this._note; }
  get metadata(): Record<string, unknown> | null { return this._metadata; }
  get createdBy(): string | null { return this._createdBy; }
  get createdAt(): Date { return this._createdAt; }

  private static validate(props: EventProps): void {
    if (!props.eventTypeId) {
      throw new InvalidEventError('O tipo de evento é obrigatório');
    }
    if (!props.entityId) {
      throw new InvalidEventError('O ID da entidade é obrigatório');
    }
    if (!EVENT_ENTITY_TYPES.includes(props.entityType)) {
      throw new InvalidEventError(`Tipo de entidade inválido: ${props.entityType}`);
    }
  }
}
