import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { PaginatedOutput } from '@/shared/pagination/pagination.types';

export interface ListProductsItemOutputDto {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  productType: ProductType;
  unit: ProductUnit;
  cost: number;
  salePrice: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ListProductsOutputDto = PaginatedOutput<ListProductsItemOutputDto>;
