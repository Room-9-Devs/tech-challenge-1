import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkOrderEventEntity1791619100000 implements MigrationInterface {
  name = 'AddWorkOrderEventEntity1791619100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "event_entity_type" ADD VALUE IF NOT EXISTS 'work_order'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "events" WHERE "entity_type"::text = 'work_order'`,
    );
    await queryRunner.query(
      `DELETE FROM "event_types" WHERE "code" LIKE 'work_order.%'`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "entity_type" TYPE text`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "allowed_entity_types" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "allowed_entity_types" TYPE text[] USING "allowed_entity_types"::text[]`,
    );
    await queryRunner.query(
      `CREATE TYPE "event_entity_type_old" AS ENUM ('client','employee','user','vehicle','product','stock','repair')`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "entity_type" TYPE "event_entity_type_old" USING "entity_type"::"event_entity_type_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "allowed_entity_types" TYPE "event_entity_type_old"[] USING "allowed_entity_types"::"event_entity_type_old"[]`,
    );
    await queryRunner.query(`DROP TYPE "event_entity_type"`);
    await queryRunner.query(
      `ALTER TYPE "event_entity_type_old" RENAME TO "event_entity_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_types" ALTER COLUMN "allowed_entity_types" SET DEFAULT '{}'`,
    );
  }
}
