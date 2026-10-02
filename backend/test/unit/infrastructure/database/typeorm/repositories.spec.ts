import { TypeOrmRoleRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-role.repository';
import { TypeOrmRefreshTokenRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeOrmProfileRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-profile.repository';
import { TypeOrmUserRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-user.repository';
import { TypeOrmServiceTypeRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-service-type.repository';
import { makeUser } from '../../../../fakes/user-fixture';
import { ServiceType } from '@/domain/entities/service-type.entity';

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

describe('TypeOrmServiceTypeRepository', () => {
  it('persists and queries service types', async () => {
    const entity = { id: 'service-1', description: 'Troca de óleo', unitValue: 120, createdAt: new Date(), updatedAt: new Date() };
    const repository = { create: jest.fn().mockReturnValue(entity), save: jest.fn().mockResolvedValue(entity), findOne: jest.fn().mockResolvedValue(entity), find: jest.fn().mockResolvedValue([entity]), softDelete: jest.fn().mockResolvedValue(undefined) };
    const service = new TypeOrmServiceTypeRepository(repository as never);
    const domain = ServiceType.create({ description: entity.description, unitValue: entity.unitValue });
    await expect(service.save(domain)).resolves.toMatchObject({ description: entity.description });
    await expect(service.findById('service-1')).resolves.toMatchObject({ id: 'service-1' });
    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findByDescription(entity.description)).resolves.toMatchObject({ description: entity.description });
    await service.delete('service-1');
    expect(repository.softDelete).toHaveBeenCalledWith('service-1');
  });
});
