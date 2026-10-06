import { TypeOrmRoleRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-role.repository';
import { TypeOrmRefreshTokenRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeOrmProfileRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-profile.repository';
import { TypeOrmUserRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-user.repository';
import { TypeOrmRepairRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-repair.repository';
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
    await expect(service.findValidByHash('hash')).resolves.toMatchObject({ userId: 'user-1' });
    await service.revoke('refresh-1');
    await service.revokeAllByUserId('user-1');
    expect(repository.update).toHaveBeenCalledTimes(2);
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
  it('saves and finds users', async () => {
    const user = makeUser();
    const queryBuilder = { leftJoinAndSelect: jest.fn(), andWhere: jest.fn(), getMany: jest.fn().mockResolvedValue([]) };
    queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
    queryBuilder.andWhere.mockReturnValue(queryBuilder);
    const repository = { createQueryBuilder: jest.fn().mockReturnValue(queryBuilder), save: jest.fn().mockImplementation(async (value) => value), findOne: jest.fn().mockResolvedValue(null) };
    const service = new TypeOrmUserRepository(repository as never);
    await expect(service.save(user)).resolves.toMatchObject({ id: user.id });
    await expect(service.findById('missing')).resolves.toBeNull();
    await expect(service.findByEmail('missing@example.com')).resolves.toBeNull();
    await expect(service.findByUsername('missing')).resolves.toBeNull();
    await expect(service.findAll({ entityType: 'client', roleSlug: 'client' })).resolves.toEqual([]);
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
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
