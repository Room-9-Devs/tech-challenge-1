import {
  StockMovementRepositories,
  StockMovementUnitOfWork,
} from '@/application/ports/stock-movement-unit-of-work.port';
import { FakeStockRepository } from './fake-stock.repository';
import { FakeStockMovementRepository } from './fake-stock-movement.repository';

export class FakeStockMovementUnitOfWork implements StockMovementUnitOfWork {
  constructor(
    private readonly stocks: FakeStockRepository,
    private readonly stockMovements: FakeStockMovementRepository,
  ) {}

  async run<T>(
    work: (repositories: StockMovementRepositories) => Promise<T>,
  ): Promise<T> {
    const stocks = this.stocks.snapshot();
    const stockMovements = this.stockMovements.snapshot();
    try {
      return await work({
        stocks: this.stocks,
        stockMovements: this.stockMovements,
      });
    } catch (error) {
      this.stocks.restore(stocks);
      this.stockMovements.restore(stockMovements);
      throw error;
    }
  }
}
