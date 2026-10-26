import { Table, TableCheck, TableForeignKey } from 'typeorm';
import { AddUserToVehiclesTable1790987850000 } from '@/infrastructure/database/typeorm/migrations/1790987850000-add-user-to-vehicles-table';
import { validateOwnerMappings } from '@/infrastructure/database/typeorm/backfill-vehicle-owners';

function runner(
  missing: number,
  table = new Table({
    name: 'vehicles',
    columns: [{ name: 'id', type: 'uuid' }],
  }),
) {
  return {
    getTable: jest.fn().mockResolvedValue(table),
    addColumn: jest.fn(),
    createForeignKey: jest.fn(),
    query: jest.fn(async (sql: string) =>
      sql.includes('COUNT(*)') ? [{ count: String(missing) }] : [],
    ),
  };
}

describe('Vehicle owner migration', () => {
  it('preserves legacy rows while requiring an owner on new writes', async () => {
    const db = runner(2);
    await new AddUserToVehiclesTable1790987850000().up(db as never);
    expect(db.addColumn).toHaveBeenCalledWith(
      'vehicles',
      expect.objectContaining({ name: 'user_id', isNullable: true }),
    );
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('NOT VALID'));
    expect(db.query).not.toHaveBeenCalledWith(
      expect.stringContaining('SET NOT NULL'),
    );
    expect(db.createForeignKey).toHaveBeenCalledWith(
      'vehicles',
      expect.objectContaining({ referencedTableName: 'users' }),
    );
  });

  it('enforces NOT NULL immediately on an empty database', async () => {
    const db = runner(0);
    await new AddUserToVehiclesTable1790987850000().up(db as never);
    expect(db.query).toHaveBeenCalledWith(
      'ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL',
    );
  });

  it('can resume a schema that already has the owner column and constraints', async () => {
    const table = new Table({
      name: 'vehicles',
      columns: [{ name: 'user_id', type: 'uuid', isNullable: true }],
    });
    table.foreignKeys.push(
      new TableForeignKey({
        name: 'FK_vehicles_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    );
    table.checks.push(
      new TableCheck({
        name: 'CHK_vehicles_user_id_required',
        expression: 'user_id IS NOT NULL',
      }),
    );
    const db = runner(0, table);
    await new AddUserToVehiclesTable1790987850000().up(db as never);
    expect(db.addColumn).not.toHaveBeenCalled();
    expect(db.createForeignKey).not.toHaveBeenCalled();
    expect(db.query).not.toHaveBeenCalledWith(
      expect.stringContaining('ADD CONSTRAINT'),
    );
  });
});

describe('Owner backfill input', () => {
  const mapping = {
    vehicleId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
  };
  it('accepts a valid explicit owner mapping', () => {
    expect(validateOwnerMappings([mapping])).toEqual([mapping]);
  });
  it.each([
    {},
    [{ vehicleId: 'bad', userId: mapping.userId }],
    [mapping, mapping],
  ])('rejects invalid or duplicated mappings', (input) => {
    expect(() => validateOwnerMappings(input)).toThrow();
  });
});
