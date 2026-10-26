import { MigrationInterface, QueryRunner } from "typeorm";

export class RepairsUniqueDescriptionPartialIndex1791800000000 implements MigrationInterface {
    name = 'RepairsUniqueDescriptionPartialIndex1791800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "repairs" DROP CONSTRAINT IF EXISTS "UQ_repairs_description"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_repairs_description_active"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_repairs_description_active" ON "repairs" ("description") WHERE "deleted_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_repairs_description_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_repairs_description"`);
        await queryRunner.query(`ALTER TABLE "repairs" ADD CONSTRAINT "UQ_repairs_description" UNIQUE ("description")`);
    }

}
