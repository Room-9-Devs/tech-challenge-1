import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockCheckConstraints1791500000000 implements MigrationInterface {
    name = 'AddStockCheckConstraints1791500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "CHK_stocks_quantity_non_negative" CHECK ("quantity" >= 0)`);
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "CHK_stocks_reserved_non_negative" CHECK ("reserved" >= 0)`);
        await queryRunner.query(`ALTER TABLE "stocks" ADD CONSTRAINT "CHK_stocks_reserved_within_quantity" CHECK ("reserved" <= "quantity")`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "CHK_stock_movements_quantity_non_negative" CHECK ("quantity" >= 0)`);
        await queryRunner.query(`ALTER TABLE "stock_movements" ADD CONSTRAINT "CHK_stock_movements_previous_quantity_non_negative" CHECK ("previous_quantity" >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "CHK_stock_movements_previous_quantity_non_negative"`);
        await queryRunner.query(`ALTER TABLE "stock_movements" DROP CONSTRAINT "CHK_stock_movements_quantity_non_negative"`);
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "CHK_stocks_reserved_within_quantity"`);
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "CHK_stocks_reserved_non_negative"`);
        await queryRunner.query(`ALTER TABLE "stocks" DROP CONSTRAINT "CHK_stocks_quantity_non_negative"`);
    }

}
