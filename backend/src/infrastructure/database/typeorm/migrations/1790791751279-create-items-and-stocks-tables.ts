import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateItemsAndStocksTables1790791751279 implements MigrationInterface {
    name = 'CreateItemsAndStocksTables1790791751279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."items_item_type_enum" AS ENUM('PART', 'CONSUMABLE')`);
        await queryRunner.query(`CREATE TYPE "public"."items_unit_enum" AS ENUM('UNIT', 'LITER', 'KILOGRAM', 'METER')`);
        await queryRunner.query(`CREATE TABLE "items" ("id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255), "item_type" "public"."items_item_type_enum" NOT NULL, "unit" "public"."items_unit_enum" NOT NULL, "cost" numeric(10,2) NOT NULL, "sale_price" numeric(10,2) NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ed4485e4da7cc242cf46db2e3a9" UNIQUE ("sku"), CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stocks" ("id" uuid NOT NULL, "item_id" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "reserved" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_e31694209cc16bed37eee2b0e3" UNIQUE ("item_id"), CONSTRAINT "PK_b5b1ee4ac914767229337974575" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "FK_e31694209cc16bed37eee2b0e3e" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "FK_e31694209cc16bed37eee2b0e3e"`);
        await queryRunner.query(`DROP TABLE "stocks"`);
        await queryRunner.query(`DROP TABLE "items"`);
        await queryRunner.query(`DROP TYPE "public"."items_unit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."items_item_type_enum"`);
    }

}
