import { PaginationQuery } from '@/shared/pagination/pagination.types';

export interface ListRepairsFiltersInputDto {
  description?: string;
  unitValue?: number;
  [key: string]: string | number | undefined;
}

export interface ListRepairsInputDto extends Partial<PaginationQuery> {
  filters?: ListRepairsFiltersInputDto;
}
