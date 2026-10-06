import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { Product } from '../entities/product.entity';

export interface ProductRepository {
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(query?: PaginationQuery & { filters?: Record<string, string | number | boolean> }): Promise<PaginatedOutput<Product>>;
  findBySku(sku: string): Promise<Product | null>;
}
