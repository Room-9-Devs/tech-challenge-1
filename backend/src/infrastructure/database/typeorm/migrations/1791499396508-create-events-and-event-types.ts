import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEventsAndEventTypes1791499396508 implements MigrationInterface {
  name = 'CreateEventsAndEventTypes1791499396508';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE event_entity_type AS ENUM (
        'client',
        'employee',
        'user',
        'vehicle',
        'product',
        'stock',
        'repair'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE event_types (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(100) NOT NULL,
        description varchar(255),
        allowed_entity_types event_entity_type[] NOT NULL DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type_id uuid NOT NULL REFERENCES event_types(id),
        entity_type event_entity_type NOT NULL,
        entity_id uuid NOT NULL,
        note text,
        metadata jsonb,
        created_by varchar(100) REFERENCES users(username) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX events_entity_idx ON events (entity_type, entity_id)',
    );
    await queryRunner.query(
      'CREATE INDEX events_type_idx ON events (event_type_id)',
    );
    await queryRunner.query(
      'CREATE INDEX events_created_at_idx ON events (created_at DESC)',
    );
    await queryRunner.query(
      'CREATE INDEX events_metadata_gin_idx ON events USING GIN (metadata)',
    );

    await this.seedEventTypes(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS events_metadata_gin_idx');
    await queryRunner.query('DROP INDEX IF EXISTS events_created_at_idx');
    await queryRunner.query('DROP INDEX IF EXISTS events_type_idx');
    await queryRunner.query('DROP INDEX IF EXISTS events_entity_idx');
    await queryRunner.dropTable('events', true);
    await queryRunner.dropTable('event_types', true);
    await queryRunner.query('DROP TYPE IF EXISTS event_entity_type');
  }

  private async seedEventTypes(queryRunner: QueryRunner): Promise<void> {
    const eventTypes = [
      { code: 'client.created', name: 'Cliente criado', allowed: ['client'] },
      { code: 'client.updated', name: 'Cliente atualizado', allowed: ['client'] },
      { code: 'employee.created', name: 'Funcionário criado', allowed: ['employee'] },
      { code: 'employee.updated', name: 'Funcionário atualizado', allowed: ['employee'] },
      { code: 'user.created', name: 'Usuário criado', allowed: ['user'] },
      { code: 'user.updated', name: 'Usuário atualizado', allowed: ['user'] },
      { code: 'user.password_changed', name: 'Senha alterada', allowed: ['user'] },
      { code: 'user.role_changed', name: 'Role alterada', allowed: ['user'] },
      { code: 'vehicle.created', name: 'Veículo criado', allowed: ['vehicle'] },
      { code: 'vehicle.updated', name: 'Veículo atualizado', allowed: ['vehicle'] },
      { code: 'vehicle.associated_to_user', name: 'Veículo vinculado a usuário', allowed: ['vehicle'] },
      { code: 'vehicle.dissociated_from_user', name: 'Veículo desvinculado de usuário', allowed: ['vehicle'] },
      { code: 'product.created', name: 'Produto criado', allowed: ['product'] },
      { code: 'product.updated', name: 'Produto atualizado', allowed: ['product'] },
      { code: 'product.price_changed', name: 'Preço alterado', allowed: ['product'] },
      { code: 'stock.adjusted', name: 'Estoque ajustado', allowed: ['stock'] },
      { code: 'stock.reserved', name: 'Estoque reservado', allowed: ['stock'] },
      { code: 'stock.released', name: 'Estoque liberado', allowed: ['stock'] },
      { code: 'repair.created', name: 'Reparo criado', allowed: ['repair'] },
      { code: 'repair.updated', name: 'Reparo atualizado', allowed: ['repair'] },
      { code: 'repair.deleted', name: 'Reparo removido', allowed: ['repair'] },
      { code: 'auth.login.succeeded', name: 'Login bem-sucedido', allowed: ['user'] },
      { code: 'auth.login.failed', name: 'Login falho', allowed: ['user'] },
      { code: 'auth.logout.succeeded', name: 'Logout realizado', allowed: ['user'] },
    ];

    for (const eventType of eventTypes) {
      await queryRunner.query(
        `INSERT INTO event_types (code, name, allowed_entity_types) VALUES ($1, $2, $3)`,
        [eventType.code, eventType.name, eventType.allowed],
      );
    }
  }
}
