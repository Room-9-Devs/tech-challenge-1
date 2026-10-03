import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsAndStocksTables1790791751279 implements MigrationInterface {
    name = 'CreateProductsAndStocksTables1790791751279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_product_type_enum" AS ENUM('PART', 'CONSUMABLE')`);
        await queryRunner.query(`CREATE TYPE "public"."products_unit_enum" AS ENUM('UNIT', 'LITER', 'KILOGRAM', 'METER')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" character varying(255), "product_type" "public"."products_product_type_enum" NOT NULL, "unit" "public"."products_unit_enum" NOT NULL, "cost" numeric(10,2) NOT NULL, "sale_price" numeric(10,2) NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stocks" ("id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "reserved" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_cdcdc9a4b531cbd24c06bc4f9e" UNIQUE ("product_id"), CONSTRAINT "PK_b5b1ee4ac914767229337974575" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "FK_cdcdc9a4b531cbd24c06bc4f9e7" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "FK_cdcdc9a4b531cbd24c06bc4f9e7"`);
        await queryRunner.query(`DROP TABLE "stocks"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_unit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."products_product_type_enum"`);
    }

}
