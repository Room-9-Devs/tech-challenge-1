import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersSoftDelete1792190000000 implements MigrationInterface {
    name = 'UsersSoftDelete1792190000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // A FK events.created_by_fkey referencia users(username) e atualizações de
        // username são inválidas para auditoria; a referencialidade de created_by
        // (string do username, criada antes do soft delete existir) é eliminada.
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "events_created_by_fkey"`);

        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP`);

        // UNIQUEs simples impossibilitam reuso de username/e-mail por outro
        // cadastro, então viram índices parciais que só contabilizam ativos.
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_username_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key"`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_username_active" ON "users" ("username") WHERE "deleted_at" IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email_active" ON "users" ("email") WHERE "deleted_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_username_active"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users" ("username") ON DELETE SET NULL`);
    }

}
