import { Brackets, SelectQueryBuilder } from 'typeorm';
import { PaginationQuery } from './pagination.types';

export interface ApplyPaginationOptions {
  searchColumns?: string[];
  searchMode?: 'any' | 'all';
  alias?: string;
  allowedSortColumns?: string[];
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
        for (const column of searchColumns) {
          if (searchMode === 'any') {
            qb.orWhere(
              new Brackets((termQb) => {
                for (const term of terms) {
                  termQb.andWhere(`${column} ILIKE :term`, {
                    term: `%${term}%`,
                  });
                }
              }),
            );
          } else {
            qb.orWhere(`${column} ILIKE :search`, { search: `%${search}%` });
          }
        }
      }),
    );
  }

  if (sort && sort.length > 0) {
    const order: Record<string, 'ASC' | 'DESC'> = {};
    for (const { field, order: direction } of sort) {
      if (options.allowedSortColumns && !options.allowedSortColumns.includes(field)) {
        continue;
      }
      const column = alias ? `${alias}.${field}` : field;
      order[column] = direction.toUpperCase() as 'ASC' | 'DESC';
    }
    if (Object.keys(order).length > 0) {
      queryBuilder.orderBy(order);
    }
  }

  queryBuilder.skip((page - 1) * limit).take(limit);

  return queryBuilder;
}
