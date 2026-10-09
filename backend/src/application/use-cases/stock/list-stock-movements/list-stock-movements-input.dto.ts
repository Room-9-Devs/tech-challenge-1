import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { PaginationQuery } from '@/shared/pagination/pagination.types';

export interface ListStockMovementsFiltersInputDto {
  productId?: string;
  movementType?: StockMovementType;
  createdBy?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ListStockMovementsInputDto extends Partial<PaginationQuery> {
  filters?: ListStockMovementsFiltersInputDto;
  startDate?: Date;
  endDate?: Date;
}
