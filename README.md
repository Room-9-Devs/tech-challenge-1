# NestJS Clean Architecture Template

Template base para projetos backend com **NestJS + TypeScript**, seguindo rigorosamente os princípios de **Clean Architecture**, com PostgreSQL e execução via Docker Compose.

## Objetivo

Este projeto é uma **base arquitetural reutilizável** que demonstra uma implementação real de uma funcionalidade completa, desde a entrada HTTP até o domínio e a persistência no PostgreSQL.

## Stack

- Node.js 20 + TypeScript
- NestJS 11
- PostgreSQL 16
- TypeORM 0.3
- Docker + Docker Compose
- Nodemon (hot reload)
- Jest (testes)
- Swagger / OpenAPI
- class-validator + class-transformer
- @nestjs/config
- ESLint + Prettier

## Arquitetura

O projeto segue **Clean Architecture**, mantendo as dependências direcionadas para as camadas internas.

```
HTTP
 ↓
Controller
 ↓
Application / Use Case
 ↓
Domain
 ↓
Repository Interface
 ↓
Infrastructure
 ↓
TypeORM
 ↓
PostgreSQL
```

### Diagrama de fluxo de uma requisição

```
                    HTTP
                     │
                     ▼
              ┌──────────────┐
              │  Controller  │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   Use Case   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │    Domain    │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │   Repository │
              │   Interface  │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │    TypeORM   │
              └──────┬───────┘
                     │
                     ▼
              ┌──────────────┐
              │  PostgreSQL  │
              └──────────────┘
```

## Estrutura de Diretórios

```
project/
│
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts
│   │   │   └── errors/
│   │   │       ├── domain.error.ts
│   │   │       ├── invalid-user.error.ts
│   │   │       ├── user-not-found.error.ts
│   │   │       └── user-already-exists.error.ts
│   │   │
│   │   ├── application/
│   │   │   └── use-cases/
│   │   │       └── users/
│   │   │           ├── create-user/
│   │   │           ├── find-user/
│   │   │           └── list-users/
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── database/
│   │   │   │   ├── typeorm/
│   │   │   │   │   ├── entities/
│   │   │   │   │   ├── repositories/
│   │   │   │   │   ├── mappers/
│   │   │   │   │   └── migrations/
│   │   │   │   └── database.module.ts
│   │   │   │
│   │   │   └── http/
│   │   │       ├── controllers/
│   │   │       ├── dtos/
│   │   │       └── filters/
│   │   │
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── test/
│   │   ├── fakes/
│   │   │   └── fake-user.repository.ts
│   │   ├── unit/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   └── infrastructure/
│   │   └── integration/
│   │       └── infrastructure/
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── jest.config.js
│   ├── nest-cli.json
│   ├── nodemon.json
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   └── .prettierrc
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Explicação das Camadas

### Domain (Camada Interna)

- **Entidades**: Objetos de negócio com comportamento e invariantes (ex: `User` valida nome e email)
- **Repositórios**: Interfaces puras, sem dependências externas
- **Erros**: Exceções específicas do domínio

**Regra de ouro**: Domain não conhece NestJS, TypeORM, PostgreSQL, HTTP ou Swagger.

### Application

- **Use Cases**: Orquestram o fluxo de negócio
- Dependem apenas de abstrações (interfaces de repositório)
- Nunca acessam TypeORM ou banco de dados diretamente

### Infrastructure (Camada Externa)

- **Database**: Implementações concretas de repositórios, entidades ORM, mappers e migrations
- **HTTP**: Controllers, DTOs e filtros de exceção
- Única camada que conhece TypeORM, PostgreSQL, NestJS decorators, etc.

## Fluxo Completo do POST /users

```
POST /users
     ↓
UsersController (recebe request, valida DTO)
     ↓
CreateUserUseCase (orquestra criação)
     ↓
User.create() (domínio valida invariantes)
     ↓
UserRepository.save() (interface)
     ↓
TypeOrmUserRepository (implementação concreta)
     ↓
UserMapper.toPersistence() (converte domínio → ORM)
     ↓
TypeORM Repository.save()
     ↓
PostgreSQL INSERT
```

## Dependency Inversion Principle (DIP)

O DIP é aplicado através da injeção de dependências do NestJS:

```typescript
// Use Case depende da abstração
class CreateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private repo: UserRepository) {}
}

// Módulo conecta abstração à implementação
{
  provide: USER_REPOSITORY,
  useClass: TypeOrmUserRepository,
}
```

Isso permite trocar a implementação do repositório sem modificar os Use Cases.

## Fake Repository nos Testes

Para testes unitários, usamos `FakeUserRepository` que implementa a mesma interface `UserRepository`:

### Produção
```
UseCase → UserRepository → TypeOrmUserRepository → PostgreSQL
```

### Teste
```
UseCase → UserRepository → FakeUserRepository (memória)
```

Benefícios:
- Testes unitários são rápidos e determinísticos
- Não dependem de Docker, PostgreSQL, filesystem ou rede
- Validam regras de negócio isoladamente

## Configuração do Ambiente

1. Clone o repositório
2. Copie o arquivo de exemplo:

```bash
cd backend
cp .env.example .env
```

3. Ajuste as variáveis conforme necessário. Pode manter as de exemplo se quiser.

### Migrations e seeds

Com o PostgreSQL disponível, execute a migration inicial e depois os seeds:

```bash
cd backend
npm run migration:run
npm run seed
```

Os seeds são separados por entidade (`roles`, `clients`, `employees` e `users`) e são idempotentes. Todos os usuários seedados usam a senha `password123`; esses dados são destinados somente ao ambiente de desenvolvimento.

## Execução com Docker Compose

Este projeto utiliza **exatamente 2 containers**:

- `backend`: NestJS com hot reload
- `postgres`: PostgreSQL com volume persistente

```bash
# Na raiz do projeto

# Iniciar os containers
docker compose up

# Em modo detached
docker compose up -d

# Ver logs
docker compose logs -f backend

# Parar
docker compose down
```

O container `backend`:
- Constrói a partir do `Dockerfile`
- Expõe a porta `3000`
- Utiliza Nodemon para hot reload
- Aguarda o PostgreSQL estar saudável antes de iniciar

O container `postgres`:
- Utiliza imagem oficial `postgres:16-alpine`
- Possui volume persistente `postgres_data`
- Possui healthcheck configurado
- Cria o database definido nas variáveis de ambiente

## Execução Local (sem Docker)

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env com DATABASE_HOST=localhost

# Iniciar em desenvolvimento com hot reload
npm run start:dev
```

## Migrations

As migrations são gerenciadas pelo TypeORM CLI:

```bash
cd backend

# Gerar uma nova migration
npm run migration:generate -- src/infrastructure/database/typeorm/migrations/NomeDaMigration

# Executar migrations pendentes
npm run migration:run

# Reverter última migration
npm run migration:revert
```

**Importante**: `synchronize: false` está configurado. Nunca utilize `synchronize: true` em produção.

## Testes

### Testes Unitários

Rápidos, isolados, sem dependências externas:

```bash
cd backend

# Executar todos os testes unitários
npm run test:unit

# Executar todos os testes
npm test

# Com watch mode
npm run test:watch

# Com cobertura
npm run test:cov
```

### Testes de Integração

Validam a persistência real com PostgreSQL:

```bash
cd backend
npm run test:integration
```

**Nota**: Certifique-se de que o PostgreSQL está acessível com as credenciais de teste configuradas.

### tsconfig.test.json

O projeto possui um `tsconfig.json` com a opção `watchOptions` configurada para melhorar o comportamento do `tsc --watch` dentro do container Docker:

```json
"watchOptions": {
  "watchFile": "fixedPollingInterval",
  "watchDirectory": "fixedPollingInterval",
  "fallbackPolling": "fixedInterval"
}
```

Embora válida para o compilador em modo watch, essa opção não é reconhecida por ferramentas como `ts-jest`, `ts-node` e o parser do ESLint, causando o erro:

```
error TS5023: Unknown compiler option 'watchOptions'
```

Para resolver isso sem alterar o `tsconfig.json` principal, foi criado o `tsconfig.test.json`, uma configuração idêntica, mas sem a opção `watchOptions`. Ele é usado por:

- **Jest**: via `jest.config.js`
- **ESLint**: via `eslint.config.mjs`
- **TypeORM CLI**: via variável de ambiente `TS_NODE_PROJECT`

Exemplo:

```bash
TS_NODE_PROJECT=tsconfig.test.json npm run migration:run
```

## Swagger / OpenAPI

A documentação da API está disponível em:

```
http://localhost:3000/docs
```

## Endpoints

### POST /users

Cria um novo usuário.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `400` - Dados inválidos
- `409` - Email já existe

### GET /users/:id

Busca um usuário pelo ID.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors:**
- `404` - Usuário não encontrado

### GET /users

Lista todos os usuários.

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Decisões Arquiteturais

### Por que Clean Architecture?

- **Independência de frameworks**: O domínio não depende de NestJS ou TypeORM
- **Testabilidade**: Use Cases e Domain podem ser testados sem infraestrutura
- **Manutenibilidade**: Mudanças na base de dados ou framework não afetam o domínio
- **Separação de responsabilidades**: Cada camada tem um propósito claro

### Por que separar Domain Entity de ORM Entity?

- Evita que constraints do TypeORM vazem para o domínio
- Permite que o domínio evolua independentemente do schema do banco
- Facilita trocar o ORM no futuro

### Por que Mapper?

- Centraliza a conversão entre Domain e Persistence
- Evita código duplicado de mapeamento
- Torna explícito onde ocorre a transformação entre camadas

### Por que Fake Repository?

- Testes unitários devem ser rápidos e determinísticos
- Não devem depender de serviços externos
- Permite testar comportamentos de erro de forma controlada

### Por que migrations ao invés de synchronize?

- Controle versionado do schema do banco
- Segurança em ambientes de produção
- Colaboração em equipe
- Rollback controlado

## Princípios Aplicados

- **Clean Architecture**: Dependências apontam para dentro
- **Dependency Inversion Principle**: Use Cases dependem de abstrações
- **Dependency Injection**: NestJS conecta implementações
- **Separation of Concerns**: Cada camada tem responsabilidade única
- **Single Responsibility Principle**: Controller fino, Use Case orquestra, Domain valida
- **Ports and Adapters**: Repository é porta, TypeOrmUserRepository é adapter
- **Domain Isolation**: Domain não conhece infraestrutura
- **Baixo Acoplamento**: Mudanças em uma camada não afetam outras
- **Alta Coesão**: Cada classe tem um propósito bem definido

## Docker Compose

O arquivo `docker-compose.yml` contém **exatamente 2 serviços**:

```yaml
services:
  backend:
    ...
  postgres:
    ...
```

Não há frontend, Redis, Nginx, PgAdmin ou qualquer outro container.
