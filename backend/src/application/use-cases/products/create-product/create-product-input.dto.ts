import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export interface CreateProductInputDto {
  sku: string;
  name: string;
  description?: string;
  productType: ProductType;
  unit: ProductUnit;
  cost: number;
  salePrice: number;
}
