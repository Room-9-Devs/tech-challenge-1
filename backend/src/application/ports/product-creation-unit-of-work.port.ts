import { ProductRepository } from '@/domain/repositories/product.repository';
import { StockRepository } from '@/domain/repositories/stock.repository';

export const PRODUCT_CREATION_UNIT_OF_WORK = Symbol(
  'PRODUCT_CREATION_UNIT_OF_WORK',
);

export interface ProductCreationRepositories {
  products: ProductRepository;
  stocks: StockRepository;
}

export interface ProductCreationUnitOfWork {
  run<T>(
    work: (repositories: ProductCreationRepositories) => Promise<T>,
  ): Promise<T>;
}
