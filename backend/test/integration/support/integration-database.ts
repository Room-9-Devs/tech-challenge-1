import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AppDataSource } from '@/infrastructure/database/typeorm/data-source';

export interface IntegrationDatabase {
  admin: DataSource;
  database: DataSource;
  schema: string;
  close(): Promise<void>;
}

export function assertIntegrationDatabase(): void {
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
}

export async function openIntegrationDatabase(): Promise<IntegrationDatabase> {
  assertIntegrationDatabase();
  const options = AppDataSource.options;
  if (options.type !== 'postgres') {
    throw new Error(
      'Integration tests require the isolated local fiap_fipe_test database on port 5433',
    );
  }

  const admin = new DataSource({
    ...options,
    migrations: [],
    migrationsRun: false,
    synchronize: false,
  });
  await admin.initialize();

  const schema = `regression_${randomUUID().replace(/-/g, '')}`;
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.query(
    'DROP TYPE IF EXISTS public.products_product_type_enum CASCADE',
  );
  await admin.query('DROP TYPE IF EXISTS public.products_unit_enum CASCADE');
  await admin.query(
    'DROP TYPE IF EXISTS public.stock_movements_movement_type_enum CASCADE',
  );

  const database = new DataSource({
    ...options,
    schema,
    extra: { options: `-c search_path=${schema},public` },
    migrationsRun: false,
    synchronize: false,
  });
  await database.initialize();
  await database.runMigrations();

  return {
    admin,
    database,
    schema,
    close: async () => {
      if (database.isInitialized) await database.destroy();
      if (/^regression_[a-f0-9]{32}$/.test(schema) && admin.isInitialized) {
        await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      }
      if (admin.isInitialized) await admin.destroy();
    },
  };
}

export async function resetWorkshopData(database: DataSource): Promise<void> {
  await database.query(`
    TRUNCATE
      work_order_items,
      work_orders,
      work_order_approval_tokens,
      work_order_number_sequences,
      stock_movements,
      events,
      stocks,
      products,
      repairs,
      vehicles,
      refresh_tokens,
      users,
      clients,
      employees,
      roles
    RESTART IDENTITY CASCADE
  `);
}
