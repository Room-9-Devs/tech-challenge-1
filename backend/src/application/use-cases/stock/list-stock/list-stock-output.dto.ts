import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { PaginatedOutput } from '@/shared/pagination/pagination.types';

export interface ListStockProductOutputDto {
  id: string;
  sku: string;
  name: string;
  productType: ProductType;
  unit: ProductUnit;
}

export interface ListStockItemOutputDto {
  id: string;
  productId: string;
  product: ListStockProductOutputDto;
  quantity: number;
  reserved: number;
  available: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ListStockOutputDto = PaginatedOutput<ListStockItemOutputDto>;
