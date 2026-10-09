import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { Product } from '../entities/product.entity';
import { StockMovement } from '../entities/stock-movement.entity';

export interface StockMovementWithProduct {
  stockMovement: StockMovement;
  product: Product;
}

export interface StockMovementQuery extends PaginationQuery {
  filters?: Record<string, string | number | boolean>;
  startDate?: Date;
  endDate?: Date;
}

export interface StockMovementRepository {
  save(stockMovement: StockMovement): Promise<StockMovement>;
  findAll(query?: StockMovementQuery): Promise<PaginatedOutput<StockMovementWithProduct>>;
}
