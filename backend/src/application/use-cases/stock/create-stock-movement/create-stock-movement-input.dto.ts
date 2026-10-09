import { StockMovementType } from '@/domain/entities/stock-movement.entity';

export interface CreateStockMovementInputDto {
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy: string;
}
