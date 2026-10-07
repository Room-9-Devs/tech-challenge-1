import { StockMovementType } from '@/domain/entities/stock-movement.entity';

export interface CreateStockMovementStockOutputDto {
  id: string;
  quantity: number;
  reserved: number;
  available: number;
  updatedAt: Date;
}

export interface CreateStockMovementOutputDto {
  id: string;
  productId: string;
  movementType: StockMovementType;
  quantity: number;
  previousQuantity: number | null;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  createdAt: Date;
  stock: CreateStockMovementStockOutputDto;
}
