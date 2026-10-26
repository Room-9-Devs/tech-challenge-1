import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  StockMovementRepositories,
  StockMovementUnitOfWork,
} from '@/application/ports/stock-movement-unit-of-work.port';
import { TypeOrmStockRepository } from './repositories/typeorm-stock.repository';
import { TypeOrmStockMovementRepository } from './repositories/typeorm-stock-movement.repository';
import { StockOrmEntity } from './entities/stock.orm-entity';
import { StockMovementOrmEntity } from './entities/stock-movement.orm-entity';

@Injectable()
export class TypeOrmStockMovementUnitOfWork implements StockMovementUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(
    work: (repositories: StockMovementRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        stocks: new TypeOrmStockRepository(
          manager.getRepository(StockOrmEntity),
        ),
        stockMovements: new TypeOrmStockMovementRepository(
          manager.getRepository(StockMovementOrmEntity),
        ),
      }),
    );
  }
}
