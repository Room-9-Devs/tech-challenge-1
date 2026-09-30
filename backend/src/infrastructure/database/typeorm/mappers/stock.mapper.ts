import { Stock } from '@/domain/entities/stock.entity';
import { StockOrmEntity } from '../entities/stock.orm-entity';

export class StockMapper {
  static toDomain(ormEntity: StockOrmEntity): Stock {
    return Stock.reconstitute({
      id: ormEntity.id,
      itemId: ormEntity.itemId,
      quantity: ormEntity.quantity,
      reserved: ormEntity.reserved,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }
}
