import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPreviousQuantityToStockMovements1791400000000 implements MigrationInterface {
    name = 'AddPreviousQuantityToStockMovements1791400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD "previous_quantity" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP COLUMN "previous_quantity"`);
    }

}
