import { Stock } from '@/domain/entities/stock.entity';
import { StockRepository } from '@/domain/repositories/stock.repository';

export class FakeStockRepository implements StockRepository {
  private stocks: Stock[] = [];

  async findByItemId(itemId: string): Promise<Stock | null> {
    return this.stocks.find((stock) => stock.itemId === itemId) ?? null;
  }

  add(stock: Stock): void {
    this.stocks.push(stock);
  }

  clear(): void {
    this.stocks = [];
  }
}
