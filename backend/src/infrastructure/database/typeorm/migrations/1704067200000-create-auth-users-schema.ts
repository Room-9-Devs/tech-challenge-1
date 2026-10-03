import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthUsersSchema1704067200000 implements MigrationInterface {
  name = 'CreateAuthUsersSchema1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(
      "CREATE TYPE document_type AS ENUM ('CPF', 'CNPJ')",
    );
    await queryRunner.query(`
      CREATE TABLE roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        slug varchar(50) NOT NULL UNIQUE,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE clients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL,
        document_type document_type NOT NULL,
        document varchar(14) NOT NULL UNIQUE,
        phone varchar(11) NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT clients_phone_format CHECK (phone ~ '^[0-9]{10,11}$')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE employees (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(150) NOT NULL,
        job_title varchar(150) NOT NULL,
        phone varchar(11) NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT employees_phone_format CHECK (phone ~ '^[0-9]{10,11}$')
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        username varchar(100) NOT NULL UNIQUE,
        email varchar(255) NOT NULL UNIQUE,
        password text NOT NULL,
        entity_type varchar(20) NOT NULL,
        entity_id uuid NOT NULL,
        role_id uuid NOT NULL REFERENCES roles(id),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT users_entity_type CHECK (entity_type IN ('client', 'employee'))
      )
    `);

    await queryRunner.query(
      'CREATE INDEX users_entity_reference_idx ON users (entity_type, entity_id)',
    );

    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash text NOT NULL UNIQUE,
        expires_at timestamp NOT NULL,
        revoked_at timestamp,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('refresh_tokens', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('employees', true);
    await queryRunner.dropTable('clients', true);
    await queryRunner.dropTable('roles', true);
    await queryRunner.query('DROP TYPE IF EXISTS document_type');
  }
}