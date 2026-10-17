import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AppDataSource } from '@/infrastructure/database/typeorm/data-source';
import { CreateAuthUsersSchema1704067200000 } from '@/infrastructure/database/typeorm/migrations/1704067200000-create-auth-users-schema';
import { AddEmployeeDocuments1704067201000 } from '@/infrastructure/database/typeorm/migrations/1704067201000-add-employee-documents';
import { CreateVehiclesTable1790815050000 } from '@/infrastructure/database/typeorm/migrations/1790815050000-create-vehicles-table';
import { AddUserToVehiclesTable1790987850000 } from '@/infrastructure/database/typeorm/migrations/1790987850000-add-user-to-vehicles-table';
import { backfillVehicleOwners } from '@/infrastructure/database/typeorm/backfill-vehicle-owners';
import { TypeOrmUserRegistrationUnitOfWork } from '@/infrastructure/database/typeorm/typeorm-user-registration-unit-of-work';
import { TypeOrmUserRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-user.repository';
import { TypeOrmVehicleRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-vehicle.repository';
import { UserOrmEntity } from '@/infrastructure/database/typeorm/entities/user.orm-entity';
import { VehicleOrmEntity } from '@/infrastructure/database/typeorm/entities/vehicle.orm-entity';
import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { DocumentAlreadyExistsError } from '@/domain/errors/document-already-exists.error';
import { FakeDomainEventPublisher } from '../fakes/fake-domain-event-publisher';

const databaseTests =
  process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true'
    ? describe
    : describe.skip;

// Opt-in only; every test owns a new schema in the dedicated local test database.
databaseTests('PostgreSQL vehicle and user persistence regressions', () => {
  let admin: DataSource;
  let database: DataSource;
  let schema: string;
  let roleId: string;
  let userId: string;

  beforeAll(async () => {
    const options = AppDataSource.options;
    if (
      options.type !== 'postgres' ||
      options.database !== 'fiap_fipe_test' ||
      !['localhost', '127.0.0.1'].includes(options.host) ||
      options.port !== 5433
    ) {
      throw new Error(
        'Integration tests require the isolated local fiap_fipe_test database on port 5433',
      );
    }
    admin = new DataSource({
      ...options,
      migrations: [],
      migrationsRun: false,
      synchronize: false,
    });
    await admin.initialize();
  }, 30000);

  beforeEach(async () => {
    const options = AppDataSource.options;
    if (options.type !== 'postgres') throw new Error('PostgreSQL is required');
    schema = `regression_${randomUUID().replace(/-/g, '')}`;
    await admin.query(`CREATE SCHEMA "${schema}"`);
    database = new DataSource({
      ...options,
      schema,
      extra: { options: `-c search_path=${schema},public` },
      migrations: [
        CreateAuthUsersSchema1704067200000,
        AddEmployeeDocuments1704067201000,
        CreateVehiclesTable1790815050000,
      ],
      migrationsRun: false,
      synchronize: false,
    });
    await database.initialize();
    await database.runMigrations();
    roleId = randomUUID();
    userId = randomUUID();
    await database.query(
      'INSERT INTO roles (id, name, slug) VALUES ($1, $2, $3)',
      [roleId, 'Client', 'client'],
    );
    await database.query(
      `INSERT INTO users (id, username, email, password, entity_type, entity_id, role_id)
      VALUES ($1, 'existing.user', 'existing@example.com', 'test-hash', 'client', $2, $3)`,
      [userId, randomUUID(), roleId],
    );
  }, 30000);

  afterEach(async () => {
    if (database?.isInitialized) await database.destroy();
    if (
      schema &&
      /^regression_[a-f0-9]{32}$/.test(schema) &&
      admin?.isInitialized
    ) {
      // This exact generated schema contains only this test's fixtures.
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    }
  });
  afterAll(async () => {
    if (admin?.isInitialized) await admin.destroy();
  });

  async function addOwners() {
    const runner = database.createQueryRunner();
    try {
      await new AddUserToVehiclesTable1790987850000().up(runner);
    } finally {
      await runner.release();
    }
  }

  async function legacyVehicle(plate: string): Promise<string> {
    const id = randomUUID();
    await database.query(
      `INSERT INTO vehicles (id, license_plate, model, brand, year, color)
      VALUES ($1, $2, 'Palio', 'Fiat', 2010, 'White')`,
      [id, plate],
    );
    return id;
  }

  function registration(missPrecheck = false) {
    const users = new TypeOrmUserRepository(
      database.getRepository(UserOrmEntity),
    );
    if (missPrecheck)
      jest.spyOn(users, 'findByUsername').mockResolvedValue(null);
    const role = { id: roleId, name: 'Client', slug: 'client' };
    return new CreateUserUseCase(
      users,
      { hash: async () => 'test-hash', compare: async () => true },
      new TypeOrmUserRegistrationUnitOfWork(database),
      {
        findAll: async () => [role],
        findById: async () => role,
        findBySlug: async () => role,
      },
      new FakeDomainEventPublisher(),
    );
  }

  const input = {
    username: 'new.client',
    email: 'new@example.com',
    password: 'password123',
    entityType: 'client' as const,
    name: 'Regression Client',
    documentType: 'CNPJ' as const,
    document: '12.ABC.345/01DE-35',
    phone: '11999999999',
  };

  it('rolls back a persisted profile when a raced duplicate username prevents account creation', async () => {
    await expect(
      registration(true).execute({ ...input, username: 'existing.user' }),
    ).rejects.toBeInstanceOf(UserAlreadyExistsError);
    const clients = await database.query('SELECT id FROM clients');
    expect(clients).toHaveLength(0);
    const saved = await registration().execute(input);
    expect(saved.profile.document).toBe('12ABC34501DE35');
    expect(saved.entityId).toBe(saved.profile.id);
    expect(await database.query('SELECT id FROM clients')).toHaveLength(1);
  });

  it('returns a domain conflict for an existing document without creating a second user', async () => {
    await registration().execute(input);
    await expect(
      registration().execute({
        ...input,
        username: 'another.client',
        email: 'another@example.com',
      }),
    ).rejects.toBeInstanceOf(DocumentAlreadyExistsError);
    expect(await database.query('SELECT id FROM clients')).toHaveLength(1);
    expect(await database.query('SELECT id FROM users')).toHaveLength(2);
  });

  it('preserves legacy rows, rejects new ownerless vehicles, and finalizes an explicit backfill', async () => {
    const id = await legacyVehicle('ABC1234');
    await addOwners();
    expect(
      await database.query('SELECT user_id FROM vehicles WHERE id = $1', [id]),
    ).toEqual([{ user_id: null }]);
    await expect(legacyVehicle('XYZ1234')).rejects.toMatchObject({
      driverError: { code: '23514' },
    });
    expect(
      await backfillVehicleOwners(database, [{ vehicleId: id, userId }]),
    ).toBe(1);
    const columns = await database.query(
      `SELECT is_nullable FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = 'vehicles' AND column_name = 'user_id'`,
      [schema],
    );
    expect(columns).toEqual([{ is_nullable: 'NO' }]);
    expect(
      await database.query('SELECT user_id FROM vehicles WHERE id = $1', [id]),
    ).toEqual([{ user_id: userId }]);
  });

  it('rolls back an incomplete legacy owner mapping', async () => {
    const first = await legacyVehicle('ABC1234');
    const second = await legacyVehicle('XYZ1234');
    await addOwners();
    await expect(
      backfillVehicleOwners(database, [{ vehicleId: first, userId }]),
    ).rejects.toThrow('still need owners');
    expect(await database.query('SELECT user_id FROM vehicles')).toEqual([
      { user_id: null },
      { user_id: null },
    ]);
    expect(
      await backfillVehicleOwners(database, [
        { vehicleId: first, userId },
        { vehicleId: second, userId },
      ]),
    ).toBe(2);
  });

  it('maps simultaneous duplicate plate writes to a conflict instead of a generic database error', async () => {
    await addOwners();
    const repository = new TypeOrmVehicleRepository(
      database.getRepository(VehicleOrmEntity),
    );
    const props = {
      user_id: userId,
      license_plate: 'ABC1D23',
      model: 'Palio',
      brand: 'Fiat',
      year: 2010,
      color: 'White',
    };
    const results = await Promise.allSettled([
      repository.save(Vehicle.create(props)),
      repository.save(Vehicle.create(props)),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const failure = results.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(failure.reason).toBeInstanceOf(VehicleAlreadyExistsError);
    expect(await database.query('SELECT id FROM vehicles')).toHaveLength(1);
  });
});
