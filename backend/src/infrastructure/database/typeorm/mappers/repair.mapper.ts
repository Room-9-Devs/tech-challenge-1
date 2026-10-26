import { Repair } from '@/domain/entities/repair.entity';
import { RepairOrmEntity } from '../entities/repair.orm-entity';

export class RepairMapper {
  static toDomain(ormEntity: RepairOrmEntity): Repair {
    return Repair.reconstitute({
      id: ormEntity.id,
      description: ormEntity.description,
      unitValue: ormEntity.unitValue,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: Repair): RepairOrmEntity {
    const ormEntity = new RepairOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.description = domainEntity.description;
    ormEntity.unitValue = domainEntity.unitValue;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
