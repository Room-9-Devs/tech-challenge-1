import { StockRepository } from '@/domain/repositories/stock.repository';
import { StockMovementRepository } from '@/domain/repositories/stock-movement.repository';

export const STOCK_MOVEMENT_UNIT_OF_WORK = Symbol(
  'STOCK_MOVEMENT_UNIT_OF_WORK',
);

export interface StockMovementRepositories {
  stocks: StockRepository;
  stockMovements: StockMovementRepository;
}

export interface StockMovementUnitOfWork {
  run<T>(
    work: (repositories: StockMovementRepositories) => Promise<T>,
  ): Promise<T>;
}
