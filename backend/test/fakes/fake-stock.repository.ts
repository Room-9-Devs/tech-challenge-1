import { Stock } from '@/domain/entities/stock.entity';
import {
  StockRepository,
  StockWithProduct,
} from '@/domain/repositories/stock.repository';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { FakeProductRepository } from './fake-product.repository';

export class FakeStockRepository implements StockRepository {
  private stocks: Stock[] = [];

  constructor(private readonly productRepository?: FakeProductRepository) {}

  async save(stock: Stock): Promise<Stock> {
    const existingIndex = this.stocks.findIndex(
      (existing) => existing.id === stock.id,
    );

    if (existingIndex >= 0) {
      this.stocks[existingIndex] = cloneStock(stock);
    } else {
      this.stocks.push(cloneStock(stock));
    }

    return cloneStock(stock);
  }

  async findByProductId(productId: string): Promise<Stock | null> {
    const stock = this.stocks.find((existing) => existing.productId === productId);
    return stock ? cloneStock(stock) : null;
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number | boolean> },
  ): Promise<PaginatedOutput<StockWithProduct>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search?.trim().toLowerCase();
    const filters = query?.filters ?? {};

    let data: StockWithProduct[] = [];

    for (const stock of this.stocks) {
      const product = await this.productRepository?.findById(stock.productId);
      if (product) {
        data.push({ stock: cloneStock(stock), product });
      }
    }

    if (filters.productId !== undefined) {
      data = data.filter(({ stock }) => stock.productId === filters.productId);
    }

    if (search) {
      const terms = search.split(/\s+/);
      data = data.filter(({ product }) =>
        terms.some(
          (term) =>
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term),
        ),
      );
    }

    if (query?.sort && query.sort.length > 0) {
      data.sort((a, b) => {
        for (const { field, order } of query.sort!) {
          const valueA = (a.stock as unknown as Record<string, unknown>)[field];
          const valueB = (b.stock as unknown as Record<string, unknown>)[field];

          if (typeof valueA !== 'number' || typeof valueB !== 'number') continue;

          const comparison = valueA - valueB;
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    data = data.slice(startIndex, startIndex + limit);

    return {
      data,
      meta: { page, limit, totalItems, totalPages },
    };
  }

  add(stock: Stock): void {
    this.stocks.push(cloneStock(stock));
  }

  clear(): void {
    this.stocks = [];
  }

  snapshot(): Stock[] {
    return this.stocks.map(cloneStock);
  }

  restore(stocks: Stock[]): void {
    this.stocks = stocks.map(cloneStock);
  }
}

function cloneStock(stock: Stock): Stock {
  return Stock.reconstitute({
    id: stock.id,
    productId: stock.productId,
    quantity: stock.quantity,
    reserved: stock.reserved,
    createdAt: stock.createdAt,
    updatedAt: stock.updatedAt,
  });
}
