import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeDocuments1704067201000 implements MigrationInterface {
  name = 'AddEmployeeDocuments1704067201000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE employees ADD COLUMN document_type document_type');
    await queryRunner.query('ALTER TABLE employees ADD COLUMN document varchar(14)');
    await queryRunner.query("UPDATE employees SET document_type = 'CPF'");
    await queryRunner.query(`
      WITH numbered_employees AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS row_number
        FROM employees
      )
      UPDATE employees
      SET document = LPAD((10000000000 + numbered_employees.row_number)::text, 11, '0')
      FROM numbered_employees
      WHERE employees.id = numbered_employees.id
    `);
    await queryRunner.query('ALTER TABLE employees ALTER COLUMN document_type SET NOT NULL');
    await queryRunner.query('ALTER TABLE employees ALTER COLUMN document SET NOT NULL');
    await queryRunner.query('ALTER TABLE employees ALTER COLUMN job_title DROP NOT NULL');
    await queryRunner.query('ALTER TABLE employees ADD CONSTRAINT employees_document_unique UNIQUE (document)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE employees DROP CONSTRAINT employees_document_unique');
    await queryRunner.query('ALTER TABLE employees ALTER COLUMN job_title SET NOT NULL');
    await queryRunner.query('ALTER TABLE employees DROP COLUMN document');
    await queryRunner.query('ALTER TABLE employees DROP COLUMN document_type');
  }
}