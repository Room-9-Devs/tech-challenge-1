import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AppDataSource } from '../typeorm/data-source';
import {
  backfillVehicleOwners,
  validateOwnerMappings,
} from '../typeorm/backfill-vehicle-owners';

async function run(): Promise<void> {
  const file = process.argv[2];
  if (!file)
    throw new Error(
      'Usage: npm run vehicles:backfill-owners -- <mapping.json>',
    );
  const mappings = validateOwnerMappings(
    JSON.parse(readFileSync(resolve(file), 'utf8')),
  );
  await AppDataSource.initialize();
  try {
    const updated = await backfillVehicleOwners(AppDataSource, mappings);
    console.log(
      `${updated} vehicle owners assigned. All vehicles now require an owner.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Vehicle owner backfill failed',
  );
  process.exitCode = 1;
});
