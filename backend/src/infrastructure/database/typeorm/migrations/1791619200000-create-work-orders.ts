import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrders1791619200000 implements MigrationInterface {
  name = 'CreateWorkOrders1791619200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_order_number_sequences" (
        "year" integer NOT NULL,
        "last_number" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_work_order_number_sequences_year" PRIMARY KEY ("year"),
        CONSTRAINT "CHK_work_order_number_sequences_last_number" CHECK ("last_number" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "work_orders" (
        "id" uuid NOT NULL,
        "number" character varying(32) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'received',
        "vehicle_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "created_by" uuid NOT NULL,
        "observations" text,
        "total_price" numeric(12,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_work_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_work_orders_number" UNIQUE ("number"),
        CONSTRAINT "CHK_work_orders_status" CHECK ("status" IN ('received', 'under_diagnosis', 'awaiting_approval', 'approved', 'in_progress', 'completed', 'delivered', 'cancelled')),
        CONSTRAINT "FK_work_orders_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_work_orders_client" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_work_orders_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_status_created_at" ON "work_orders" ("status", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_client_created_at" ON "work_orders" ("client_id", "created_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "work_order_items" (
        "id" uuid NOT NULL,
        "work_order_id" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL,
        "unit_price" numeric(10,2) NOT NULL,
        "service_id" uuid,
        "product_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_work_order_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_work_order_items_quantity" CHECK ("quantity" > 0),
        CONSTRAINT "CHK_work_order_items_unit_price" CHECK ("unit_price" >= 0),
        CONSTRAINT "CHK_work_order_items_catalog_reference" CHECK (("service_id" IS NOT NULL) <> ("product_id" IS NOT NULL)),
        CONSTRAINT "FK_work_order_items_work_order" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_work_order_items_service" FOREIGN KEY ("service_id") REFERENCES "repairs"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_work_order_items_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_work_order_items_work_order" ON "work_order_items" ("work_order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "work_order_items"`);
    await queryRunner.query(`DROP INDEX "IDX_work_orders_client_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_work_orders_status_created_at"`);
    await queryRunner.query(`DROP TABLE "work_orders"`);
    await queryRunner.query(`DROP TABLE "work_order_number_sequences"`);
  }
}
