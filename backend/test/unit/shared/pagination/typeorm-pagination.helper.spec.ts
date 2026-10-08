import { Brackets, SelectQueryBuilder } from 'typeorm';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';

type RecordedWhere = { condition: unknown; params?: Record<string, unknown> };
type SearchCondition = {
  column: string;
  parameter: string;
  params: Record<string, unknown>;
};

const createQueryBuilder = () => {
  const wheres: RecordedWhere[] = [];
  const orderBys: Record<string, unknown>[] = [];
  const queryBuilder = {
    andWhere: jest.fn((condition: unknown, params?: Record<string, unknown>) => {
      wheres.push({ condition, params });
      return queryBuilder;
    }),
    orderBy: jest.fn((order: Record<string, unknown>) => {
      orderBys.push(order);
      return queryBuilder;
    }),
    skip: jest.fn(() => queryBuilder),
    take: jest.fn(() => queryBuilder),
  };
  return { queryBuilder, wheres, orderBys };
};

const flattenBrackets = (brackets: Brackets): SearchCondition[] => {
  const conditions: SearchCondition[] = [];
  const record = (condition: unknown, params?: Record<string, unknown>) => {
    if (condition instanceof Brackets) {
      condition.whereFactory(recorder as never);
      return;
    }
    if (typeof condition === 'string') {
      const [column, parameter] = condition.split(' ILIKE ');
      conditions.push({
        column,
        parameter: parameter.replace(':', ''),
        params: params ?? {},
      });
    }
  };
  const recorder = {
    andWhere: (condition: unknown, params?: Record<string, unknown>) =>
      record(condition, params),
    orWhere: (condition: unknown, params?: Record<string, unknown>) =>
      record(condition, params),
  };
  brackets.whereFactory(recorder as never);
  return conditions;
};

describe('applyPagination', () => {
  it('applies skip and take from page and limit', () => {
    const { queryBuilder } = createQueryBuilder();

    applyPagination(
      queryBuilder as unknown as SelectQueryBuilder<unknown>,
      { page: 3, limit: 25 },
      {},
    );

    expect(queryBuilder.skip).toHaveBeenCalledWith(50);
    expect(queryBuilder.take).toHaveBeenCalledWith(25);
  });

  it('orders only by the allowed columns', () => {
    const { queryBuilder, orderBys } = createQueryBuilder();

    applyPagination(
      queryBuilder as unknown as SelectQueryBuilder<unknown>,
      {
        page: 1,
        limit: 10,
        sort: [
          { field: 'username', order: 'asc' },
          { field: 'password', order: 'desc' },
        ],
      },
      { alias: 'user', allowedSortColumns: ['username'] },
    );

    expect(orderBys).toEqual([{ 'user.username': 'ASC' }]);
  });

  it('orders a mapped field by its select alias instead of alias.field', () => {
    const { queryBuilder, orderBys } = createQueryBuilder();

    applyPagination(
      queryBuilder as unknown as SelectQueryBuilder<unknown>,
      {
        page: 1,
        limit: 10,
        sort: [{ field: 'profile.name', order: 'desc' }],
      },
      {
        alias: 'user',
        allowedSortColumns: ['profile.name', 'username'],
        sortColumnMap: { 'profile.name': 'profile_name' },
      },
    );

    expect(orderBys).toEqual([{ profile_name: 'DESC' }]);
  });

  it('gives each search column and term its own parameter', () => {
    const { queryBuilder, wheres } = createQueryBuilder();

    applyPagination(
      queryBuilder as unknown as SelectQueryBuilder<unknown>,
      { page: 1, limit: 10, search: 'ana maria' },
      { searchColumns: ['user.username', 'user.email'] },
    );

    const conditions = flattenBrackets(wheres[0].condition as Brackets);
    expect(conditions.map((condition) => condition.column)).toEqual([
      'user.username',
      'user.username',
      'user.email',
      'user.email',
    ]);

    // O TypeORM compartilha o mapa de parâmetros entre os Brackets: se dois ILIKE
    // usarem o mesmo nome, o último valor sobrescreve todos os anteriores.
    const parameters = conditions.map((condition) => condition.parameter);
    expect(new Set(parameters).size).toBe(parameters.length);

    const values = conditions.flatMap((condition) =>
      Object.values(condition.params),
    );
    expect([...values].sort()).toEqual(['%ana%', '%ana%', '%maria%', '%maria%']);
  });

  it('searches the whole phrase per column in all mode', () => {
    const { queryBuilder, wheres } = createQueryBuilder();

    applyPagination(
      queryBuilder as unknown as SelectQueryBuilder<unknown>,
      { page: 1, limit: 10, search: 'ana maria' },
      { searchColumns: ['user.username', 'user.email'], searchMode: 'all' },
    );

    const conditions = flattenBrackets(wheres[0].condition as Brackets);
    expect(conditions.map((condition) => condition.column)).toEqual([
      'user.username',
      'user.email',
    ]);
    const parameters = conditions.map((condition) => condition.parameter);
    expect(new Set(parameters).size).toBe(parameters.length);
    expect(
      conditions.flatMap((condition) => Object.values(condition.params)),
    ).toEqual(['%ana maria%', '%ana maria%']);
  });

  it('does not touch the query when there is no search', () => {
    const { queryBuilder, wheres } = createQueryBuilder();

    applyPagination(
      queryBuilder as unknown as SelectQueryBuilder<unknown>,
      { page: 1, limit: 10 },
      { searchColumns: ['user.username'] },
    );

    expect(wheres).toEqual([]);
    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
  });
});
