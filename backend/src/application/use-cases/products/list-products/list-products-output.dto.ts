import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export interface ListProductsOutputDto {
  products: {
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
  }[];
}
