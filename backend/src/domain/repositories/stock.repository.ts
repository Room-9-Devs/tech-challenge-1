import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { Product } from '../entities/product.entity';
import { Stock } from '../entities/stock.entity';

export interface StockWithProduct {
  stock: Stock;
  product: Product;
}

export interface StockRepository {
  save(stock: Stock): Promise<Stock>;
  findByProductId(productId: string): Promise<Stock | null>;
  findAll(query?: PaginationQuery & { filters?: Record<string, string | number | boolean> }): Promise<PaginatedOutput<StockWithProduct>>;
}
