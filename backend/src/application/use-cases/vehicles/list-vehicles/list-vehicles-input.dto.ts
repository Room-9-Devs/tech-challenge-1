import { PaginationQuery } from '@/shared/pagination/pagination.types';

export interface ListVehiclesFiltersInputDto {
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  userId?: string;
  [key: string]: string | number | undefined;
}

export interface ListVehiclesInputDto extends Partial<PaginationQuery> {
  filters?: ListVehiclesFiltersInputDto;
}
