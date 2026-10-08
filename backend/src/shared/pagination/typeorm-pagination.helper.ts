import { Brackets, SelectQueryBuilder } from 'typeorm';
import { PaginationQuery } from './pagination.types';

export interface ApplyPaginationOptions {
  searchColumns?: string[];
  searchMode?: 'any' | 'all';
  alias?: string;
  allowedSortColumns?: string[];
  sortColumnMap?: Record<string, string>;
}

export function applyPagination<T>(
  queryBuilder: SelectQueryBuilder<T>,
  query: PaginationQuery,
  options: ApplyPaginationOptions = {},
): SelectQueryBuilder<T> {
  const { page, limit, search, sort } = query;
  const { searchColumns = [], searchMode = 'any', alias } = options;

  if (search && searchColumns.length > 0) {
    const terms = search.trim().split(/\s+/);

    queryBuilder.andWhere(
      new Brackets((qb) => {
        searchColumns.forEach((column, columnIndex) => {
          if (searchMode === 'any') {
            qb.orWhere(
              new Brackets((termQb) => {
                terms.forEach((term, termIndex) => {
                  const paramName = `search_${columnIndex}_${termIndex}`;
                  termQb.andWhere(`${column} ILIKE :${paramName}`, {
                    [paramName]: `%${term}%`,
                  });
                });
              }),
            );
          } else {
            const paramName = `search_${columnIndex}_full`;
            qb.orWhere(`${column} ILIKE :${paramName}`, {
              [paramName]: `%${search}%`,
            });
          }
        });
      }),
    );
  }

  if (sort && sort.length > 0) {
    const order: Record<string, 'ASC' | 'DESC'> = {};
    for (const { field, order: direction } of sort) {
      if (options.allowedSortColumns && !options.allowedSortColumns.includes(field)) {
        continue;
      }
      const column =
        options.sortColumnMap?.[field] ?? (alias ? `${alias}.${field}` : field);
      order[column] = direction.toUpperCase() as 'ASC' | 'DESC';
    }
    if (Object.keys(order).length > 0) {
      queryBuilder.orderBy(order);
    }
  }

  queryBuilder.skip((page - 1) * limit).take(limit);

  return queryBuilder;
}
