import { PaginationQuery } from '@/shared/pagination/pagination.types';

export interface ListUsersFiltersInputDto {
  username?: string;
  email?: string;
  entityType?: string;
  entityId?: string;
  role?: string;
  profile?: object;

  [key: string]: string | number | object | undefined;
}

export interface ListUsersInputDto extends Partial<PaginationQuery> {
  filters?: ListUsersFiltersInputDto;
}
