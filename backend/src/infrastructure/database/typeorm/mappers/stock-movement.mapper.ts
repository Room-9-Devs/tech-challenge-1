import { StockMovement } from '@/domain/entities/stock-movement.entity';
import { StockMovementOrmEntity } from '../entities/stock-movement.orm-entity';

export class StockMovementMapper {
  static toDomain(ormEntity: StockMovementOrmEntity): StockMovement {
    return StockMovement.reconstitute({
      id: ormEntity.id,
      productId: ormEntity.productId,
      quantity: ormEntity.quantity,
      previousQuantity: ormEntity.previousQuantity,
      movementType: ormEntity.movementType,
      description: ormEntity.description,
      referenceType: ormEntity.referenceType,
      referenceId: ormEntity.referenceId,
      createdBy: ormEntity.createdBy,
      createdAt: ormEntity.createdAt,
    });
  }

  static toPersistence(domainEntity: StockMovement): StockMovementOrmEntity {
    const ormEntity = new StockMovementOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.productId = domainEntity.productId;
    ormEntity.quantity = domainEntity.quantity;
    ormEntity.previousQuantity = domainEntity.previousQuantity;
    ormEntity.movementType = domainEntity.movementType;
    ormEntity.description = domainEntity.description;
    ormEntity.referenceType = domainEntity.referenceType;
    ormEntity.referenceId = domainEntity.referenceId;
    ormEntity.createdBy = domainEntity.createdBy;
    ormEntity.createdAt = domainEntity.createdAt;
    return ormEntity;
  }
}
