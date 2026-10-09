import {
  ProductCreationRepositories,
  ProductCreationUnitOfWork,
} from '@/application/ports/product-creation-unit-of-work.port';
import { FakeProductRepository } from './fake-product.repository';
import { FakeStockRepository } from './fake-stock.repository';

export class FakeProductCreationUnitOfWork implements ProductCreationUnitOfWork {
  constructor(
    private readonly products: FakeProductRepository,
    private readonly stocks: FakeStockRepository,
  ) {}

  async run<T>(
    work: (repositories: ProductCreationRepositories) => Promise<T>,
  ): Promise<T> {
    const products = this.products.snapshot();
    const stocks = this.stocks.snapshot();
    try {
      return await work({ products: this.products, stocks: this.stocks });
    } catch (error) {
      this.products.restore(products);
      this.stocks.restore(stocks);
      throw error;
    }
  }
}
