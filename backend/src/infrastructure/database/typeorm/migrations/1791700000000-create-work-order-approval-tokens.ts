import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrderApprovalTokens1791700000000 implements MigrationInterface {
  name = 'CreateWorkOrderApprovalTokens1791700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_order_approval_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "work_order_id" uuid NOT NULL,
        "client_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "revoked_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_work_order_approval_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_work_order_approval_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_work_order_approval_tokens_work_order" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_work_order_approval_tokens_client" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_work_order_approval_tokens_work_order" ON "work_order_approval_tokens" ("work_order_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_work_order_approval_tokens_work_order"`,
    );
    await queryRunner.query(`DROP TABLE "work_order_approval_tokens"`);
  }
}
