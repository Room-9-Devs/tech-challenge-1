import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStockMovementsTable1791300000000 implements MigrationInterface {
    name = 'CreateStockMovementsTable1791300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."stock_movements_movement_type_enum" AS ENUM('IN', 'OUT', 'ADJUSTMENT')`);
        await queryRunner.query(`CREATE TABLE "stock_movements" ("id" uuid NOT NULL, "product_id" uuid NOT NULL, "quantity" integer NOT NULL, "movement_type" "public"."stock_movements_movement_type_enum" NOT NULL, "description" text, "reference_type" character varying(50), "reference_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" uuid NOT NULL, CONSTRAINT "PK_stock_movements_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_stock_movements_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_stock_movements_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_stock_movements_created_by"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_stock_movements_product_id"`);
        await queryRunner.query(`DROP TABLE "stock_movements"`);
        await queryRunner.query(`DROP TYPE "public"."stock_movements_movement_type_enum"`);
    }

}
