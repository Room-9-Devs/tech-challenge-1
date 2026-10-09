import { EventType } from '@/domain/entities/event-type.entity';
import { EventTypeOrmEntity } from '../entities/event-type.orm-entity';

export class EventTypeMapper {
  static toDomain(ormEntity: EventTypeOrmEntity): EventType {
    return EventType.reconstitute({
      id: ormEntity.id,
      code: ormEntity.code,
      name: ormEntity.name,
      description: ormEntity.description,
      allowedEntityTypes: ormEntity.allowedEntityTypes,
      createdAt: ormEntity.createdAt,
    });
  }

  static toPersistence(domainEntity: EventType): EventTypeOrmEntity {
    const ormEntity = new EventTypeOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.code = domainEntity.code;
    ormEntity.name = domainEntity.name;
    ormEntity.description = domainEntity.description;
    ormEntity.allowedEntityTypes = domainEntity.allowedEntityTypes;
    ormEntity.createdAt = domainEntity.createdAt;
    return ormEntity;
  }
}
