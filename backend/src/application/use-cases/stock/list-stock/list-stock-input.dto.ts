import { PaginationQuery } from '@/shared/pagination/pagination.types';

export interface ListStockFiltersInputDto {
  productId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ListStockInputDto extends Partial<PaginationQuery> {
  filters?: ListStockFiltersInputDto;
}
