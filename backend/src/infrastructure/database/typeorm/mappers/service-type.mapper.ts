import { ServiceType } from '@/domain/entities/service-type.entity';
import { ServiceTypeOrmEntity } from '../entities/service-type.orm-entity';

export class ServiceTypeMapper {
  static toDomain(ormEntity: ServiceTypeOrmEntity): ServiceType {
    return ServiceType.reconstitute({
      id: ormEntity.id,
      description: ormEntity.description,
      unitValue: ormEntity.unitValue,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: ServiceType): ServiceTypeOrmEntity {
    const ormEntity = new ServiceTypeOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.description = domainEntity.description;
    ormEntity.unitValue = domainEntity.unitValue;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
