import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { PaginationQuery } from '@/shared/pagination/pagination.types';

export interface ListProductsFiltersInputDto {
  sku?: string;
  name?: string;
  productType?: ProductType;
  unit?: ProductUnit;
  [key: string]: string | number | boolean | undefined;
}

export interface ListProductsInputDto extends Partial<PaginationQuery> {
  filters?: ListProductsFiltersInputDto;
}
