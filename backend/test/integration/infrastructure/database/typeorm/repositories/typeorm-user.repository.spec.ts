/**
 * ============================================================================
 * TESTE DE INTEGRAÇÃO - TypeOrmUserRepository
 * ============================================================================
 *
 * Este arquivo demonstra como criar testes de integração que validam a
 * implementação concreta do repositório com um banco de dados PostgreSQL real.
 *
 * IMPORTANTE:
 * - Testes de integração dependem de infraestrutura externa (PostgreSQL)
 * - Eles são mais lentos e frágeis que testes unitários
 * - Use-os para validar queries, mapeamentos e comportamento do ORM
 * - NUNCA substitua testes unitários por testes de integração
 *
 * PARA EXECUTAR ESTE TESTE:
 * 1. Certifique-se de que o PostgreSQL está rodando (via Docker ou local)
 * 2. Configure as variáveis de ambiente de teste
 * 3. Execute: npm run test:integration
 *
 * DECISÃO ARQUITETURAL:
 * - Separamos testes unitários (test/unit/) de testes de integração (test/integration/)
 * - Testes unitários usam FakeUserRepository (sem banco de dados)
 * - Testes de integração usam TypeOrmUserRepository (com PostgreSQL real)
 */

import { DataSource, Repository } from 'typeorm';
import { TypeOrmUserRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-user.repository';
import { UserOrmEntity } from '@/infrastructure/database/typeorm/entities/user.orm-entity';
import { User } from '@/domain/entities/user.entity';

/**
 * Suite de testes de integração para TypeOrmUserRepository.
 *
 * ANTES DE CADA TESTE:
 * - Criamos uma conexão com o PostgreSQL
 * - Inicializamos o schema (criamos a tabela)
 * - Instanciamos o repositório real
 *
 * DEPOIS DE CADA TESTE:
 * - Limpamos a tabela para garantir isolamento entre testes
 * - Fechamos a conexão
 */
describe('TypeOrmUserRepository (Integration)', () => {
  let dataSource: DataSource;
  let repository: TypeOrmUserRepository;
  let ormRepository: Repository<UserOrmEntity>;

  beforeEach(async () => {
    /**
     * Criamos uma conexão com o banco de dados de teste.
     * Em um projeto real, você pode usar um banco de dados separado
     * ou um container Docker temporário para testes.
     */
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.TEST_DATABASE_PORT || '5432', 10),
      username: process.env.TEST_DATABASE_USER || 'postgres',
      password: process.env.TEST_DATABASE_PASSWORD || 'postgres',
      database: process.env.TEST_DATABASE_NAME || 'app_test',
      entities: [UserOrmEntity],
      synchronize: true, // Apenas para testes! Cria as tabelas automaticamente
    });

    await dataSource.initialize();

    ormRepository = dataSource.getRepository(UserOrmEntity);
    repository = new TypeOrmUserRepository(ormRepository);
  });

  afterEach(async () => {
    /**
     * Garantimos que cada teste seja isolado limpando a tabela
     * e fechando a conexão após cada execução.
     */
    if (dataSource && dataSource.isInitialized) {
      await ormRepository.clear();
      await dataSource.destroy();
    }
  });

  it('should save a user and retrieve it by id', async () => {
    /**
     * Teste end-to-end de persistência:
     * 1. Criamos uma entidade de domínio
     * 2. Salvamos via repositório
     * 3. Recuperamos do banco
     * 4. Verificamos que os dados estão corretos
     */
    const user = User.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const savedUser = await repository.save(user);
    const foundUser = await repository.findById(savedUser.id);

    expect(foundUser).not.toBeNull();
    expect(foundUser!.id).toBe(savedUser.id);
    expect(foundUser!.name).toBe('John Doe');
    expect(foundUser!.email).toBe('john@example.com');
  });

  it('should find user by email', async () => {
    const user = User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    await repository.save(user);

    const foundUser = await repository.findByEmail('jane@example.com');

    expect(foundUser).not.toBeNull();
    expect(foundUser!.email).toBe('jane@example.com');
  });

  it('should return null when user does not exist', async () => {
    const foundUser = await repository.findById('non-existent-id');

    expect(foundUser).toBeNull();
  });

  it('should return all users', async () => {
    const user1 = User.create({ name: 'User 1', email: 'user1@example.com' });
    const user2 = User.create({ name: 'User 2', email: 'user2@example.com' });

    await repository.save(user1);
    await repository.save(user2);

    const users = await repository.findAll();

    expect(users).toHaveLength(2);
  });
});
