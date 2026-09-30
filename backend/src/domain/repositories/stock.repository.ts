import { Stock } from '../entities/stock.entity';

export interface StockRepository {
  findByItemId(itemId: string): Promise<Stock | null>;
}
