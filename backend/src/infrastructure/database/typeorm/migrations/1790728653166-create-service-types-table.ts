import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateServiceTypesTable1790728653166 implements MigrationInterface {
    name = 'CreateServiceTypesTable1790728653166'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "service_types" ("id" uuid NOT NULL, "description" character varying(255) NOT NULL, "unit_value" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_55e7d14870d0e1827810c230ead" UNIQUE ("description"), CONSTRAINT "PK_1dc93417a097cdee3491f39d7cc" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "service_types"`);
    }

}
