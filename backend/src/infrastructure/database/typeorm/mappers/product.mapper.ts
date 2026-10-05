import { Product } from '@/domain/entities/product.entity';
import { ProductOrmEntity } from '../entities/product.orm-entity';

export class ProductMapper {
  static toDomain(ormEntity: ProductOrmEntity): Product {
    return Product.reconstitute({
      id: ormEntity.id,
      sku: ormEntity.sku,
      name: ormEntity.name,
      description: ormEntity.description,
      productType: ormEntity.productType,
      unit: ormEntity.unit,
      cost: ormEntity.cost,
      salePrice: ormEntity.salePrice,
      active: ormEntity.active,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: Product): ProductOrmEntity {
    const ormEntity = new ProductOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.sku = domainEntity.sku;
    ormEntity.name = domainEntity.name;
    ormEntity.description = domainEntity.description;
    ormEntity.productType = domainEntity.productType;
    ormEntity.unit = domainEntity.unit;
    ormEntity.cost = domainEntity.cost;
    ormEntity.salePrice = domainEntity.salePrice;
    ormEntity.active = domainEntity.active;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
