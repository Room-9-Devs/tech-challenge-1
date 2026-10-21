import { isUUID } from 'class-validator';
import { DataSource } from 'typeorm';

export interface VehicleOwnerMapping {
  vehicleId: string;
  userId: string;
}

export function validateOwnerMappings(value: unknown): VehicleOwnerMapping[] {
  if (!Array.isArray(value))
    throw new Error('O mapeamento de donos deve ser um array JSON');
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
        'Cada item do mapeamento de donos deve ter vehicleId e userId com UUIDs válidos',
      );
    }
    const vehicleId = item.vehicleId.toLowerCase();
    if (seen.has(vehicleId))
      throw new Error(`Veículo duplicado no mapeamento de donos: ${vehicleId}`);
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
        throw new Error(`Veículo não encontrado: ${mapping.vehicleId}`);
      if (
        vehicles[0].user_id !== null &&
        vehicles[0].user_id !== mapping.userId
      ) {
        throw new Error(
          `O veículo já tem outro dono: ${mapping.vehicleId}`,
        );
      }
      const users: Array<{ id: string }> = await manager.query(
        'SELECT id FROM users WHERE id = $1 FOR KEY SHARE',
        [mapping.userId],
      );
      if (!users.length) throw new Error(`Usuário não encontrado: ${mapping.userId}`);
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
