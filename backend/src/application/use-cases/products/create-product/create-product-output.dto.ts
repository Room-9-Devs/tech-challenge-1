import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export interface CreateProductOutputDto {
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
