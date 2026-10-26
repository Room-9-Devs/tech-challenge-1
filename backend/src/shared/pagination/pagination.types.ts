export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}


export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
  sort?: SortConfig[];
}

export interface PaginatedOutput<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
