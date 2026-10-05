import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRepairsTable1791168385775 implements MigrationInterface {
    name = 'CreateRepairsTable1791168385775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "service_types"`);
        await queryRunner.query(`CREATE TABLE "repairs" ("id" uuid NOT NULL, "description" character varying(255) NOT NULL, "unit_value" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_repairs_description" UNIQUE ("description"), CONSTRAINT "PK_repairs_id" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "repairs"`);
    }

}
