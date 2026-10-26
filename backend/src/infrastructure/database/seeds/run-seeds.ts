import { AppDataSource } from '../typeorm/data-source';
import { seedClients } from './client.seed';
import { seedEmployees } from './employee.seed';
import { seedRoles } from './role.seed';
import { seedUsers } from './user.seed';

async function run(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await seedRoles(AppDataSource);
    await seedClients(AppDataSource);
    await seedEmployees(AppDataSource);
    await seedUsers(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});