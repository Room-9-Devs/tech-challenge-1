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
});

describe('RepairSeedService', () => {
  it('seeds defaults only when the repository is empty', async () => {
    const repository = { findAll: jest.fn().mockResolvedValue([]), save: jest.fn().mockResolvedValue(undefined) };
    await new RepairSeedService(repository as never).run();
    expect(repository.save).toHaveBeenCalledTimes(12);
  });

  it('skips seeding when repairs already exist', async () => {
    const repository = { findAll: jest.fn().mockResolvedValue([{ id: 'repair-1' }]), save: jest.fn() };
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
