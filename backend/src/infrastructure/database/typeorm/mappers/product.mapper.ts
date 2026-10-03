import { Item } from '@/domain/entities/item.entity';
import { ItemOrmEntity } from '../entities/item.orm-entity';

export class ItemMapper {
  static toDomain(ormEntity: ItemOrmEntity): Item {
    return Item.reconstitute({
      id: ormEntity.id,
      sku: ormEntity.sku,
      name: ormEntity.name,
      description: ormEntity.description,
      itemType: ormEntity.itemType,
      unit: ormEntity.unit,
      cost: ormEntity.cost,
      salePrice: ormEntity.salePrice,
      active: ormEntity.active,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: Item): ItemOrmEntity {
    const ormEntity = new ItemOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.sku = domainEntity.sku;
    ormEntity.name = domainEntity.name;
    ormEntity.description = domainEntity.description;
    ormEntity.itemType = domainEntity.itemType;
    ormEntity.unit = domainEntity.unit;
    ormEntity.cost = domainEntity.cost;
    ormEntity.salePrice = domainEntity.salePrice;
    ormEntity.active = domainEntity.active;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
