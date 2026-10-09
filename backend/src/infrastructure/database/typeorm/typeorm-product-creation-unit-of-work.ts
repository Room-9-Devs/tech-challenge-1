import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  ProductCreationRepositories,
  ProductCreationUnitOfWork,
} from '@/application/ports/product-creation-unit-of-work.port';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { TypeOrmStockRepository } from './repositories/typeorm-stock.repository';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { StockOrmEntity } from './entities/stock.orm-entity';

@Injectable()
export class TypeOrmProductCreationUnitOfWork implements ProductCreationUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(
    work: (repositories: ProductCreationRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        products: new TypeOrmProductRepository(
          manager.getRepository(ProductOrmEntity),
        ),
        stocks: new TypeOrmStockRepository(
          manager.getRepository(StockOrmEntity),
        ),
      }),
    );
  }
}
