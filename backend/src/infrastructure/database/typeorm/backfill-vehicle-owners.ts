import { isUUID } from 'class-validator';
import { DataSource } from 'typeorm';

export interface VehicleOwnerMapping {
  vehicleId: string;
  userId: string;
}

export function validateOwnerMappings(value: unknown): VehicleOwnerMapping[] {
  if (!Array.isArray(value))
    throw new Error('Owner mapping must be a JSON array');
  const seen = new Set<string>();
  return value.map((item: unknown) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('vehicleId' in item) ||
      !('userId' in item) ||
      typeof item.vehicleId !== 'string' ||
      typeof item.userId !== 'string' ||
      !isUUID(item.vehicleId) ||
      !isUUID(item.userId)
    ) {
      throw new Error(
        'Each owner mapping must contain valid vehicleId and userId UUIDs',
      );
    }
    const vehicleId = item.vehicleId.toLowerCase();
    if (seen.has(vehicleId))
      throw new Error(`Duplicate vehicle in owner mapping: ${vehicleId}`);
    seen.add(vehicleId);
    return { vehicleId, userId: item.userId.toLowerCase() };
  });
}

export async function backfillVehicleOwners(
  dataSource: DataSource,
  input: unknown,
): Promise<number> {
  const mappings = validateOwnerMappings(input);
  return dataSource.transaction(async (manager) => {
    await manager.query('LOCK TABLE vehicles IN SHARE ROW EXCLUSIVE MODE');
    let updated = 0;
    for (const mapping of mappings) {
      const vehicles: Array<{ user_id: string | null }> = await manager.query(
        'SELECT user_id FROM vehicles WHERE id = $1 FOR UPDATE',
        [mapping.vehicleId],
      );
      if (!vehicles.length)
        throw new Error(`Vehicle not found: ${mapping.vehicleId}`);
      if (
        vehicles[0].user_id !== null &&
        vehicles[0].user_id !== mapping.userId
      ) {
        throw new Error(
          `Vehicle already has a different owner: ${mapping.vehicleId}`,
        );
      }
      const users: Array<{ id: string }> = await manager.query(
        'SELECT id FROM users WHERE id = $1 FOR KEY SHARE',
        [mapping.userId],
      );
      if (!users.length) throw new Error(`User not found: ${mapping.userId}`);
      if (vehicles[0].user_id === null) {
        await manager.query(
          'UPDATE vehicles SET user_id = $1, updated_at = now() WHERE id = $2',
          [mapping.userId, mapping.vehicleId],
        );
        updated++;
      }
    }
    const missing: Array<{ count: string }> = await manager.query(
      'SELECT COUNT(*) AS count FROM vehicles WHERE user_id IS NULL',
    );
    if (Number(missing[0].count) > 0)
      throw new Error(
        `${missing[0].count} vehicles still need owners; supply a complete mapping. No changes were committed.`,
      );
    const checks: unknown[] = await manager.query(
      "SELECT 1 FROM pg_constraint WHERE conrelid = 'vehicles'::regclass AND conname = $1",
      ['CHK_vehicles_user_id_required'],
    );
    if (checks.length)
      await manager.query(
        'ALTER TABLE vehicles VALIDATE CONSTRAINT "CHK_vehicles_user_id_required"',
      );
    await manager.query(
      'ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL',
    );
    return updated;
  });
}
