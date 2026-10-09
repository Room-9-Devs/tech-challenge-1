import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMissingProductStocks1791400001000 implements MigrationInterface {
    name = 'CreateMissingProductStocks1791400001000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "stocks" ("id", "product_id", "quantity", "reserved") SELECT gen_random_uuid(), "products"."id", 0, 0 FROM "products" LEFT JOIN "stocks" ON "stocks"."product_id" = "products"."id" WHERE "stocks"."id" IS NULL`);
    }

    public async down(): Promise<void> {}

}
