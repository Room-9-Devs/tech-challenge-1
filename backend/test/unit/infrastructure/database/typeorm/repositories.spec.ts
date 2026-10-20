import { Brackets, IsNull } from 'typeorm';
import { TypeOrmRoleRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-role.repository';
import { TypeOrmRefreshTokenRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeOrmProfileRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-profile.repository';
import { TypeOrmUserRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-user.repository';
import { TypeOrmRepairRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-repair.repository';
import { ClientOrmEntity } from '@/infrastructure/database/typeorm/entities/client.orm-entity';
import { EmployeeOrmEntity } from '@/infrastructure/database/typeorm/entities/employee.orm-entity';
import { makeUser } from '../../../../fakes/user-fixture';
import { Repair } from '@/domain/entities/repair.entity';

const role = { id: 'role-client', name: 'Cliente', slug: 'client' };

describe('TypeOrmRoleRepository', () => {
  it('lists and finds roles', async () => {
    const repository = { find: jest.fn().mockResolvedValue([role]), findOneBy: jest.fn().mockResolvedValue(role) };
    const service = new TypeOrmRoleRepository(repository as never);
    await expect(service.findAll()).resolves.toEqual([role]);
    await expect(service.findBySlug('client')).resolves.toEqual(role);
    await expect(service.findById('role-client')).resolves.toEqual(role);
  });
});

describe('TypeOrmRefreshTokenRepository', () => {
  it('persists, finds and revokes refresh tokens', async () => {
    const entity = { id: 'refresh-1', userId: 'user-1', tokenHash: 'hash', expiresAt: new Date(Date.now() + 60000), revokedAt: null };
    const repository = { create: jest.fn().mockReturnValue(entity), save: jest.fn().mockResolvedValue(entity), findOne: jest.fn().mockResolvedValue(entity), update: jest.fn().mockResolvedValue(undefined) };
    const service = new TypeOrmRefreshTokenRepository(repository as never);
    await expect(service.save({ userId: entity.userId, tokenHash: entity.tokenHash, expiresAt: entity.expiresAt, revokedAt: null })).resolves.toMatchObject({ id: 'refresh-1' });
    await expect(service.findByHash('hash')).resolves.toMatchObject({ userId: 'user-1' });
    expect(repository.findOne).toHaveBeenLastCalledWith({ where: { tokenHash: 'hash' } });
    await expect(service.findValidByHash('hash')).resolves.toMatchObject({ userId: 'user-1' });
    await service.revoke('refresh-1');
    await service.revokeAllByUserId('user-1');
    expect(repository.update).toHaveBeenCalledTimes(2);
  });

  it('revokes conditionally and reports whether the token was still active', async () => {
    const repository = { update: jest.fn() };
    repository.update
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: 0 });
    const service = new TypeOrmRefreshTokenRepository(repository as never);

    await expect(service.revokeIfActive('refresh-1')).resolves.toBe(true);
    await expect(service.revokeIfActive('refresh-1')).resolves.toBe(false);

    expect(repository.update).toHaveBeenNthCalledWith(1, { id: 'refresh-1', revokedAt: IsNull() }, { revokedAt: expect.any(Date) });
    expect(repository.update).toHaveBeenNthCalledWith(2, { id: 'refresh-1', revokedAt: IsNull() }, { revokedAt: expect.any(Date) });
  });
});

describe('TypeOrmProfileRepository', () => {
  it('creates and finds client and employee profiles', async () => {
    const client = { id: 'client-1', name: 'Cliente', documentType: 'CPF', document: '111', phone: '119' };
    const employee = { id: 'employee-1', name: 'Funcionário', documentType: 'CPF', document: '222', phone: '119', jobTitle: null };
    const clients = { create: jest.fn().mockReturnValue(client), save: jest.fn().mockResolvedValue(client), findOneBy: jest.fn().mockResolvedValue(client) };
    const employees = { create: jest.fn().mockReturnValue(employee), save: jest.fn().mockResolvedValue(employee), findOneBy: jest.fn().mockResolvedValue(employee) };
    const service = new TypeOrmProfileRepository(clients as never, employees as never);
    await expect(service.createClient({ name: 'Cliente', documentType: 'CPF', document: '111', phone: '119' })).resolves.toMatchObject({ type: 'client' });
    await expect(service.createEmployee({ name: 'Funcionário', documentType: 'CPF', document: '222', phone: '119' })).resolves.toMatchObject({ type: 'employee' });
    await expect(service.findById('client', 'client-1')).resolves.toMatchObject({ id: 'client-1' });
    await expect(service.findById('employee', 'employee-1')).resolves.toMatchObject({ id: 'employee-1' });
  });
});

describe('TypeOrmUserRepository', () => {
  const collectBrackets = (brackets: Brackets): string[] => {
    const conditions: string[] = [];
    const record = (condition: unknown): void => {
      if (condition instanceof Brackets) condition.whereFactory(recorder as never);
      else if (typeof condition === 'string') conditions.push(condition);
    };
    const recorder = {
      andWhere: (condition: unknown) => record(condition),
      orWhere: (condition: unknown) => record(condition),
    };
    brackets.whereFactory(recorder as never);
    return conditions;
  };

  const createQueryBuilder = () => {
    const joins: { entity: unknown; alias: string; condition: string }[] = [];
    const wheres: { condition: unknown; params?: Record<string, unknown> }[] = [];
    const selects: { selection: string; aliasName?: string }[] = [];
    const orderBys: Record<string, unknown>[] = [];
    const queryBuilder = {
      leftJoin: jest.fn((entity: unknown, alias: string, condition: string) => {
        joins.push({ entity, alias, condition });
        return queryBuilder;
      }),
      andWhere: jest.fn((condition: unknown, params?: Record<string, unknown>) => {
        wheres.push({ condition, params });
        return queryBuilder;
      }),
      addSelect: jest.fn((selection: string, aliasName?: string) => {
        selects.push({ selection, aliasName });
        return queryBuilder;
      }),
      orderBy: jest.fn((order: Record<string, unknown>) => {
        orderBys.push(order);
        return queryBuilder;
      }),
      skip: jest.fn(() => queryBuilder),
      take: jest.fn(() => queryBuilder),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    return { queryBuilder, joins, wheres, selects, orderBys };
  };

  it('saves and finds users', async () => {
    const user = makeUser();
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder), save: jest.fn().mockImplementation(async (value) => value), findOne: jest.fn().mockResolvedValue(null) };
    const service = new TypeOrmUserRepository(repository as never);
    await expect(service.save(user)).resolves.toMatchObject({ id: user.id });
    await expect(service.findById('missing')).resolves.toBeNull();
    await expect(service.findByEmail('missing@example.com')).resolves.toBeNull();
    await expect(service.findByUsername('missing')).resolves.toBeNull();

    await expect(
      service.findAll({ page: 1, limit: 10, filters: { entityType: 'client', roleSlug: 'client' } }),
    ).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    expect(wheres[0].params).toEqual({ filter_entityType: 'client' });
  });

  it('joins the profiles so the search can match the user name', async () => {
    const { queryBuilder, joins } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({ page: 1, limit: 10, search: 'jose' });

    expect(joins.map((join) => join.alias)).toEqual(['client', 'employee']);
    expect(joins.map((join) => join.entity)).toEqual([ClientOrmEntity, EmployeeOrmEntity]);
    expect(joins.map((join) => join.condition)).toEqual([
      'client."id" = "user"."entity_id" AND "user"."entity_type" = \'client\'',
      'employee."id" = "user"."entity_id" AND "user"."entity_type" = \'employee\'',
    ]);
  });

  it('searches by username, email and profile name', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({ page: 1, limit: 10, search: 'jose' });

    const conditions = collectBrackets(wheres[0].condition as Brackets);
    expect(conditions.map((condition) => condition.split(' ILIKE ')[0])).toEqual([
      'user.username',
      'user.email',
      'client.name',
      'employee.name',
    ]);
    expect(conditions.join(' ')).not.toContain('description');
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
  });

  it('filters by profile name through the profiles', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      filters: { 'profile.name': 'José Silveira' },
    });

    expect(wheres[0].condition).toBe(
      'COALESCE(client.name, employee.name) = :filter_profile_name',
    );
    expect(wheres[0].params).toEqual({ filter_profile_name: 'José Silveira' });
  });

  it('filters by profile document through the profiles', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      filters: { 'profile.document': '11111111111' },
    });

    expect(wheres[0].condition).toBe(
      'COALESCE(client.document, employee.document) = :filter_profile_document',
    );
    expect(wheres[0].params).toEqual({ filter_profile_document: '11111111111' });
  });

  it('filters by cpf matching the document type', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      filters: { cpf: '11111111111' },
    });

    expect(wheres[0].condition).toBe(
      'COALESCE(client.document, employee.document) = :filter_cpf_document AND COALESCE(client.document_type, employee.document_type) = :filter_cpf_type',
    );
    expect(wheres[0].params).toEqual({
      filter_cpf_document: '11111111111',
      filter_cpf_type: 'CPF',
    });
  });

  it('strips the mask from document filters', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      filters: { cpf: '111.222.333-44', 'profile.document': '11.111.111/0001-11' },
    });

    expect(wheres[0].params).toEqual({ filter_cpf_document: '11122233344', filter_cpf_type: 'CPF' });
    expect(wheres[1].params).toEqual({ filter_profile_document: '11111111000111' });
  });

  it('filters by cnpj matching the document type', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      filters: { cnpj: '11222333000181' },
    });

    expect(wheres[0].condition).toBe(
      'COALESCE(client.document, employee.document) = :filter_cnpj_document AND COALESCE(client.document_type, employee.document_type) = :filter_cnpj_type',
    );
    expect(wheres[0].params).toEqual({
      filter_cnpj_document: '11222333000181',
      filter_cnpj_type: 'CNPJ',
    });
  });

  it('ignores document filters that are not allowed', async () => {
    const { queryBuilder, wheres } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      filters: { documentType: 'CPF' },
    });

    expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    expect(wheres).toEqual([]);
  });

  it('sorts by profile name through a calculated select alias', async () => {
    const { queryBuilder, selects, orderBys } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      sort: [{ field: 'profile.name', order: 'asc' }],
    });

    expect(selects).toEqual([
      {
        selection: 'COALESCE(client.name, employee.name)',
        aliasName: 'profile_name',
      },
    ]);
    expect(orderBys).toEqual([{ profile_name: 'ASC' }]);
  });

  it('sorts by its own columns without the calculated select', async () => {
    const { queryBuilder, selects, orderBys } = createQueryBuilder();
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder) };
    const service = new TypeOrmUserRepository(repository as never);

    await service.findAll({
      page: 1,
      limit: 10,
      sort: [{ field: 'username', order: 'asc' }],
    });

    expect(selects).toEqual([]);
    expect(queryBuilder.addSelect).not.toHaveBeenCalled();
    expect(orderBys).toEqual([{ 'user.username': 'ASC' }]);
  });
});

describe('TypeOrmRepairRepository', () => {
  it('persists and queries repairs', async () => {
    const entity = { id: 'repair-1', description: 'Troca de óleo', unitValue: 120, createdAt: new Date(), updatedAt: new Date(), deletedAt: null };
    const queryBuilder = {
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([[entity], 1]),
    };
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.skip.mockReturnValue(queryBuilder);
    queryBuilder.take.mockReturnValue(queryBuilder);

    const repository = {
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
      findOne: jest.fn().mockResolvedValue(entity),
      find: jest.fn().mockResolvedValue([entity]),
      softDelete: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new TypeOrmRepairRepository(repository as never);
    const domain = Repair.create({ description: entity.description, unitValue: entity.unitValue });
    await expect(service.save(domain)).resolves.toMatchObject({ description: entity.description });
    await expect(service.findById('repair-1')).resolves.toMatchObject({ id: 'repair-1' });
    const findAllResult = await service.findAll();
    expect(findAllResult.data).toHaveLength(1);
    expect(findAllResult.meta.totalItems).toBe(1);
    await expect(service.findByDescription(entity.description)).resolves.toMatchObject({ description: entity.description });
    await service.delete('repair-1');
    expect(repository.softDelete).toHaveBeenCalledWith('repair-1');
  });
});
