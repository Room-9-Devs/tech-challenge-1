import { Event } from '@/domain/entities/event.entity';
import { EventOrmEntity } from '../entities/event.orm-entity';

export class EventMapper {
  static toDomain(ormEntity: EventOrmEntity): Event {
    return Event.reconstitute({
      id: ormEntity.id,
      eventTypeId: ormEntity.eventTypeId,
      entityType: ormEntity.entityType,
      entityId: ormEntity.entityId,
      note: ormEntity.note,
      metadata: ormEntity.metadata,
      createdBy: ormEntity.createdBy,
      createdAt: ormEntity.createdAt,
    });
  }

  static toPersistence(domainEntity: Event): EventOrmEntity {
    const ormEntity = new EventOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.eventTypeId = domainEntity.eventTypeId;
    ormEntity.entityType = domainEntity.entityType;
    ormEntity.entityId = domainEntity.entityId;
    ormEntity.note = domainEntity.note;
    ormEntity.metadata = domainEntity.metadata;
    ormEntity.createdBy = domainEntity.createdBy;
    ormEntity.createdAt = domainEntity.createdAt;
    return ormEntity;
  }
}
