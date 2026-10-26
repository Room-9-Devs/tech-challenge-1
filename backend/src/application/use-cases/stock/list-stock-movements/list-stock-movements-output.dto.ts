import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { PaginatedOutput } from '@/shared/pagination/pagination.types';
import { ListStockProductOutputDto } from '../list-stock/list-stock-output.dto';

export interface ListStockMovementsItemOutputDto {
  id: string;
  productId: string;
  product: ListStockProductOutputDto;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number | null;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  createdAt: Date;
}

export type ListStockMovementsOutputDto =
  PaginatedOutput<ListStockMovementsItemOutputDto>;
