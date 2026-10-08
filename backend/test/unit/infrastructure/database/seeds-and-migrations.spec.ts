import { Cpf, Cnpj } from '@/domain/value-objects';
import { seedClients } from '@/infrastructure/database/seeds/client.seed';
import { seedEmployees } from '@/infrastructure/database/seeds/employee.seed';
import { seedRoles } from '@/infrastructure/database/seeds/role.seed';
import { seedUsers } from '@/infrastructure/database/seeds/user.seed';
import { RepairSeedService } from '@/infrastructure/database/typeorm/seeds/repair.seed';
import { CreateAuthUsersSchema1704067200000 } from '@/infrastructure/database/typeorm/migrations/1704067200000-create-auth-users-schema';
import { AddEmployeeDocuments1704067201000 } from '@/infrastructure/database/typeorm/migrations/1704067201000-add-employee-documents';
import { CreateRepairsTable1791168385775 } from '@/infrastructure/database/typeorm/migrations/1791168385775-create-repairs-table';

describe('database seeds', () => {
  it('creates initial clients, employees and roles', async () => {
    const repositories = new Map<any, any>();
    const makeRepository = () => ({ findOneBy: jest.fn().mockResolvedValue(null), create: jest.fn((value) => value), save: jest.fn().mockResolvedValue(undefined) });
    const dataSource = { getRepository: jest.fn((entity) => { if (!repositories.has(entity)) repositories.set(entity, makeRepository()); return repositories.get(entity); }) };
    await seedClients(dataSource as never);
    await seedEmployees(dataSource as never);
    await seedRoles(dataSource as never);
    expect(dataSource.getRepository).toHaveBeenCalled();
  });

  it('skips existing seed records', async () => {
    const repository = { findOneBy: jest.fn().mockResolvedValue({ id: 'existing' }), create: jest.fn(), save: jest.fn() };
    const dataSource = { getRepository: jest.fn().mockReturnValue(repository) };
    await seedClients(dataSource as never);
    await seedEmployees(dataSource as never);
    await seedRoles(dataSource as never);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('seeds users with hashed passwords and skips existing usernames', async () => {
    const userRepository = { findOneBy: jest.fn().mockResolvedValue(null), create: jest.fn((value) => value), save: jest.fn().mockResolvedValue(undefined) };
    const roleRepository = { findOneByOrFail: jest.fn(async ({ slug }: { slug: string }) => ({ id: `role-${slug}` })) };
    const employeeRepository = { findOneByOrFail: jest.fn(async ({ name }: { name: string }) => ({ id: name })) };
    const clientRepository = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'client-1' }) };
    const dataSource = { getRepository: jest.fn((entity: any) => entity.name.includes('User') ? userRepository : entity.name.includes('Role') ? roleRepository : entity.name.includes('Employee') ? employeeRepository : clientRepository) };
    await seedUsers(dataSource as never);
    expect(userRepository.save).toHaveBeenCalledTimes(4);
    expect(userRepository.create.mock.calls[0][0].password).toMatch(/^scrypt\$/);
  });

  it('skips an existing user during user seeding', async () => {
    const userRepository = { findOneBy: jest.fn().mockResolvedValue({ id: 'existing' }), create: jest.fn(), save: jest.fn() };
    const roleRepository = { findOneByOrFail: jest.fn(async ({ slug }: { slug: string }) => ({ id: `role-${slug}` })) };
    const employeeRepository = { findOneByOrFail: jest.fn(async ({ name }: { name: string }) => ({ id: name })) };
    const clientRepository = { findOneByOrFail: jest.fn().mockResolvedValue({ id: 'client-1' }) };
    const dataSource = { getRepository: jest.fn((entity: any) => entity.name.includes('User') ? userRepository : entity.name.includes('Role') ? roleRepository : entity.name.includes('Employee') ? employeeRepository : clientRepository) };
    await seedUsers(dataSource as never);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('seeds fake documents that are valid according to the value objects', async () => {
    const created: Array<{ documentType: string; document: string }> = [];
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: { documentType: string; document: string }) => {
        created.push(value);
        return value;
      }),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = { getRepository: jest.fn().mockReturnValue(repository) };

    await seedClients(dataSource as never);
    await seedEmployees(dataSource as never);

    expect(created).toHaveLength(4);
    expect(new Set(created.map((record) => record.document)).size).toBe(4);
    for (const record of created) {
      expect(() =>
        record.documentType === 'CPF'
          ? new Cpf(record.document)
          : new Cnpj(record.document),
      ).not.toThrow();
    }
  });

  it('looks the seeded client user up by the document declared in the client seed', async () => {
    const seededClients: Array<{ document: string }> = [];
    const clientSeedRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: { document: string }) => {
        seededClients.push(value);
        return value;
      }),
      save: jest.fn().mockResolvedValue(undefined),
    };
    await seedClients({
      getRepository: jest.fn().mockReturnValue(clientSeedRepository),
    } as never);

    const clientLookups: Array<Record<string, string>> = [];
    const userRepository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: Record<string, string>) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const roleRepository = {
      findOneByOrFail: jest.fn(async ({ slug }: { slug: string }) => ({
        id: slug,
      })),
    };
    const employeeRepository = {
      findOneByOrFail: jest.fn(async ({ name }: { name: string }) => ({
        id: name,
      })),
    };
    const profileRepository = {
      findOneByOrFail: jest.fn(
        async (query: Record<string, string>) => {
          clientLookups.push(query);
          return { id: 'client-1' };
        },
      ),
    };
    const dataSource = {
      getRepository: jest.fn((entity: { name: string }) =>
        entity.name.includes('User')
          ? userRepository
          : entity.name.includes('Role')
            ? roleRepository
            : entity.name.includes('Employee')
              ? employeeRepository
              : profileRepository,
      ),
    };

    await seedUsers(dataSource as never);

    expect(clientLookups).toEqual([{ document: seededClients[0].document }]);
  });

  it('refreshes stale profile documents instead of inserting duplicates', async () => {
    const repository = {
      findOneBy: jest.fn(async (query: Record<string, string>) =>
        query.document ? null : { id: `existing-${query.name}`, ...query },
      ),
      create: jest.fn((value: Record<string, string>) => value),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const dataSource = { getRepository: jest.fn().mockReturnValue(repository) };

    await seedClients(dataSource as never);
    await seedEmployees(dataSource as never);

    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledTimes(4);
    expect(repository.update).toHaveBeenCalledWith(
      'existing-Agnaldo Guimarães',
      expect.objectContaining({ document: '45612378955' }),
    );
  });
});

describe('RepairSeedService', () => {
  it('seeds defaults only when the repository is empty', async () => {
    const repository = { findAll: jest.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 } }), save: jest.fn().mockResolvedValue(undefined) };
    await new RepairSeedService(repository as never).run();
    expect(repository.save).toHaveBeenCalledTimes(12);
  });

  it('skips seeding when repairs already exist', async () => {
    const repository = { findAll: jest.fn().mockResolvedValue({ data: [{ id: 'repair-1' }], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } }), save: jest.fn() };
    await new RepairSeedService(repository as never).run();
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('database migrations', () => {
  it('runs and reverts the auth schema migration', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined), dropTable: jest.fn().mockResolvedValue(undefined) };
    const migration = new CreateAuthUsersSchema1704067200000();
    await migration.up(queryRunner as never);
    await migration.down(queryRunner as never);
    expect(queryRunner.query).toHaveBeenCalled();
    expect(queryRunner.dropTable).toHaveBeenCalledWith('users', true);
  });

  it('runs and reverts employee document migration', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) };
    const migration = new AddEmployeeDocuments1704067201000();
    await migration.up(queryRunner as never);
    await migration.down(queryRunner as never);
    expect(queryRunner.query).toHaveBeenCalled();
  });

  it('runs and reverts repairs migration', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) };
    const migration = new CreateRepairsTable1791168385775();
    await migration.up(queryRunner as never);
    await migration.down(queryRunner as never);
    expect(queryRunner.query).toHaveBeenCalledTimes(3);
  });
});
