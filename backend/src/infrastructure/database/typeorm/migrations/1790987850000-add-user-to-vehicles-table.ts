import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class AddUserToVehiclesTable1790987850000 implements MigrationInterface {
  name = 'AddUserToVehiclesTable1790987850000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vehicles');
    if (!table)
      throw new Error('A tabela vehicles precisa existir antes de adicionar os donos');
    if (!table.findColumnByName('user_id'))
      await queryRunner.addColumn(
        'vehicles',
        new TableColumn({
          name: 'user_id',
          type: 'uuid',
          isNullable: true,
        }),
      );

    if (!table.foreignKeys.some((key) => key.name === 'FK_vehicles_user_id'))
      await queryRunner.createForeignKey(
        'vehicles',
        new TableForeignKey({
          name: 'FK_vehicles_user_id',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

    // Keep legacy rows readable, but require an owner for every new/updated row.
    if (
      !table.checks.some(
        (check) => check.name === 'CHK_vehicles_user_id_required',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE vehicles ADD CONSTRAINT "CHK_vehicles_user_id_required" CHECK (user_id IS NOT NULL) NOT VALID',
      );
    }
    const missing: Array<{ count: string }> = await queryRunner.query(
      'SELECT COUNT(*) AS count FROM vehicles WHERE user_id IS NULL',
    );
    if (Number(missing[0].count) === 0) {
      await queryRunner.query(
        'ALTER TABLE vehicles VALIDATE CONSTRAINT "CHK_vehicles_user_id_required"',
      );
      await queryRunner.query(
        'ALTER TABLE vehicles ALTER COLUMN user_id SET NOT NULL',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('vehicles', 'FK_vehicles_user_id');
    await queryRunner.dropColumn('vehicles', 'user_id');
  }
}
