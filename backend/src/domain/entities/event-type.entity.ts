import { randomUUID } from 'crypto';
import { EventEntityType } from '@/domain/types/entity-reference.type';
import { InvalidEventTypeError } from '../errors/invalid-event-type.error';

export interface EventTypeProps {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  allowedEntityTypes?: EventEntityType[];
  createdAt?: Date;
}

export class EventType {
  private readonly _id: string;
  private readonly _code: string;
  private readonly _name: string;
  private readonly _description: string | null;
  private readonly _allowedEntityTypes: EventEntityType[];
  private readonly _createdAt: Date;

  private constructor(props: EventTypeProps) {
    this._id = props.id ?? randomUUID();
    this._code = props.code;
    this._name = props.name;
    this._description = props.description ?? null;
    this._allowedEntityTypes = props.allowedEntityTypes ?? [];
    this._createdAt = props.createdAt ?? new Date();
  }

  public static create(props: EventTypeProps): EventType {
    EventType.validate(props);
    return new EventType(props);
  }

  public static reconstitute(props: EventTypeProps): EventType {
    return new EventType(props);
  }

  get id(): string { return this._id; }
  get code(): string { return this._code; }
  get name(): string { return this._name; }
  get description(): string | null { return this._description; }
  get allowedEntityTypes(): EventEntityType[] { return [...this._allowedEntityTypes]; }
  get createdAt(): Date { return this._createdAt; }

  public allowsEntityType(entityType: EventEntityType): boolean {
    if (this._allowedEntityTypes.length === 0) return true;
    return this._allowedEntityTypes.includes(entityType);
  }

  private static validate(props: EventTypeProps): void {
    if (!props.code || !/^[a-z][a-z0-9_.]*$/.test(props.code)) {
      throw new InvalidEventTypeError('O código deve ser um slug em minúsculas (ex: user.created)');
    }
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidEventTypeError('O nome é obrigatório');
    }
  }
}
