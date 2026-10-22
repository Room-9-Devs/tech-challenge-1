# Sistema de Gestão da Oficina Mecânica

Back-end (MVP) de um sistema integrado de atendimento e execução de serviços para uma oficina mecânica, desenvolvido em **NestJS + TypeScript** com **PostgreSQL**, **Domain-Driven Design** e **Clean Architecture**. Tech Challenge da Fase 1 da pós-graduação SOAT (Software Architecture) da FIAP.

**Equipe:** Felipe Santana, Julio Cavalcanti, Kevin Villanova, Matheus Andrell e Michel Lisboa.

## Objetivo

Substituir as anotações manuais e planilhas da oficina por um sistema que organize o atendimento de ponta a ponta: cadastro de clientes e veículos, abertura e acompanhamento das ordens de serviço, orçamento e aprovação pelo cliente, controle de peças e insumos e indicadores de tempo de execução, com boas práticas de qualidade de software e segurança.

## Descrição da solução

API RESTful monolítica que cobre o ciclo completo da Ordem de Serviço (OS):

- **Atendimento:** identificação do cliente por CPF/CNPJ, cadastro do veículo (com consulta de preço na tabela FIPE) e abertura da OS.
- **Orçamento:** inclusão de serviços, peças e insumos, com o orçamento calculado automaticamente a partir dos preços do catálogo.
- **Aprovação:** o orçamento é enviado por e-mail ao cliente, que aprova ou recusa pelo link do e-mail (sem login) ou pela API.
- **Acompanhamento:** a OS percorre os status Recebida, Em diagnóstico, Aguardando aprovação, Aprovada, Em execução, Finalizada e Entregue (ou Cancelada), com as regras de transição aplicadas pelo domínio. O cliente consulta o andamento das próprias OS pela API.
- **Estoque:** as peças são reservadas no envio do orçamento, baixadas na aprovação e liberadas na recusa, na mesma transação da mudança de status.
- **Gestão administrativa:** CRUD de clientes, veículos, serviços e peças/insumos, controle de estoque, histórico de auditoria e indicadores, como o tempo médio de execução.
- **Segurança:** autenticação JWT com refresh token e controle de acesso por papel (`admin`, `staff` e `client`).

## Arquitetura

O back-end é um **monólito organizado em camadas** segundo a **Clean Architecture** ([ADR-003](docs/adr/adr-003-arquitetura.md)), com as dependências direcionadas para as camadas internas. O domínio está dividido em bounded contexts (Atendimento / Ordem de Serviço, Estoque, Cadastros, Identidade e Acesso, Notificações, Histórico de Eventos e Indicadores), que se comunicam por chamadas diretas e por eventos de domínio publicados em memória.

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

A arquitetura completa está documentada no [modelo C4](docs/c4/README.md) (contexto, containers, componentes e código) e o domínio, no [Modelo de Domínio](docs/ddd/modelo-de-dominio.md).

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

### Explicação das camadas

#### Domain (camada interna)

- **Entidades**: objetos de negócio com comportamento e invariantes (ex.: `WorkOrder` aplica as regras de transição de status e só aceita itens antes do envio do orçamento)
- **Objetos de valor**: `Cpf`, `Cnpj` e `Phone`, que se validam na criação
- **Eventos de domínio**: fatos do negócio, como `work_order.status_changed` e `stock.reserved`
- **Repositórios**: interfaces puras, sem dependências externas
- **Erros**: exceções específicas do domínio, cada uma com o status HTTP correspondente

**Regra de ouro**: Domain não conhece NestJS, TypeORM, PostgreSQL, HTTP ou Swagger.

#### Application

- **Use Cases**: orquestram o fluxo de negócio
- **Ports**: interfaces de saída (envio de e-mail, consulta à FIPE, tokens, Unit of Work, publicação de eventos)
- **Event handlers**: reagem aos eventos de domínio (auditoria e notificações por e-mail)
- Dependem apenas de abstrações; nunca acessam TypeORM ou o banco de dados diretamente

#### Infrastructure (camada externa)

- **Database**: implementações concretas de repositórios e Unit of Work, entidades ORM, mappers, migrations e seeds
- **HTTP**: controllers, DTOs, guards, filtros de exceção, HATEOAS e as páginas HTML de aprovação do orçamento
- **Services**: adaptadores técnicos (JWT, hash de senha, Resend, FIPE e publicação de eventos)
- Única camada que conhece TypeORM, PostgreSQL, decorators do NestJS etc.

### Fluxo completo do POST /users

```
POST /users
     ↓
UsersController (recebe a requisição; o DTO é validado pelo ValidationPipe)
     ↓
CreateUserUseCase (orquestra o cadastro)
     ↓
Cpf / Cnpj / Phone (objetos de valor validam documento e telefone)
     ↓
User.create() (domínio valida as invariantes; senha com hash scrypt)
     ↓
UserRegistrationUnitOfWork.run() (perfil + usuário na mesma transação)
     ↓
TypeOrmUserRepository + TypeOrmProfileRepository (implementações concretas)
     ↓
UserMapper.toPersistence() (converte domínio → ORM)
     ↓
PostgreSQL INSERT (COMMIT)
     ↓
DomainEventPublisher.publish(user.created) → handler de auditoria grava em events
```

### Dependency Inversion Principle (DIP)

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

### Decisões arquiteturais

As decisões estão registradas em [ADRs](docs/adr/README.md). As principais:

#### Por que Clean Architecture?

- **Independência de frameworks**: o domínio não depende de NestJS ou TypeORM
- **Testabilidade**: Use Cases e Domain podem ser testados sem infraestrutura
- **Manutenibilidade**: mudanças na base de dados ou framework não afetam o domínio
- **Separação de responsabilidades**: cada camada tem um propósito claro

#### Por que separar Domain Entity de ORM Entity?

- Evita que constraints do TypeORM vazem para o domínio
- Permite que o domínio evolua independentemente do schema do banco
- Facilita trocar o ORM no futuro

#### Por que Mapper?

- Centraliza a conversão entre Domain e Persistence
- Evita código duplicado de mapeamento
- Torna explícito onde ocorre a transformação entre camadas

#### Por que Fake Repository?

- Testes unitários devem ser rápidos e determinísticos
- Não devem depender de serviços externos
- Permite testar comportamentos de erro de forma controlada

#### Por que migrations ao invés de synchronize?

- Controle versionado do schema do banco
- Segurança em ambientes de produção
- Colaboração em equipe
- Rollback controlado

### Princípios aplicados

- **Clean Architecture**: dependências apontam para dentro
- **Dependency Inversion Principle**: Use Cases dependem de abstrações
- **Dependency Injection**: NestJS conecta implementações
- **Separation of Concerns**: cada camada tem responsabilidade única
- **Single Responsibility Principle**: Controller fino, Use Case orquestra, Domain valida
- **Ports and Adapters**: o repositório e as demais portas são interfaces; `TypeOrmUserRepository`, `ResendEmailSender` e `ParallelumFipeGateway` são adapters
- **Domain Isolation**: Domain não conhece infraestrutura
- **Baixo acoplamento**: mudanças em uma camada não afetam outras; notificações e auditoria reagem a eventos sem que os casos de uso as conheçam
- **Alta coesão**: cada classe tem um propósito bem definido

## Tecnologias

- Node.js 24 + TypeScript
- NestJS 11 (Express como HTTP adapter)
- PostgreSQL 18
- TypeORM 0.3 (migrations versionadas)
- JWT (`@nestjs/jwt`) com refresh token opaco e hash de senha scrypt
- class-validator + class-transformer
- Swagger / OpenAPI
- EventEmitter2 (eventos de domínio em memória)
- Resend (envio de e-mails transacionais)
- API FIPE da Parallelum (preços de veículos)
- Jest (testes unitários e de integração)
- ESLint + Prettier
- Docker + Docker Compose
- SonarQube (análise estática) e Trivy (análise de vulnerabilidades)

## Banco de dados

O banco principal é o **PostgreSQL 18** ([ADR-002](docs/adr/adr-002-banco-dados.md)). A escolha se deve à natureza do domínio, que tem relacionamentos bem definidos entre as entidades (cliente, veículo, ordem de serviço, itens, estoque) e exige consistência e integridade dos dados. O PostgreSQL atende às transações que o projeto precisa, como a mudança de status da OS junto com a reserva ou a baixa do estoque, integra-se bem com a stack (NestJS + TypeORM) e é conhecido pela equipe. Bancos NoSQL e MySQL/MariaDB foram considerados e descartados no ADR.

O schema é criado e versionado pelas migrations do TypeORM (`synchronize: false`). O modelo de dados (DER conceitual e físico) está em [docs/database](docs/database/README.md).

## Pré-requisitos

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) com Docker Compose v2
- Para rodar fora do Docker: [Node.js 24](https://nodejs.org/) e npm, além de um PostgreSQL acessível

## Como executar

### Configuração do ambiente

1. Clone o repositório.
2. Copie o arquivo de exemplo:

```bash
cd backend
cp .env.example .env
```

3. Ajuste as variáveis conforme necessário. Os valores de exemplo funcionam para o ambiente local; a única obrigatória é `JWT_SECRET` (a aplicação não sobe sem ela).

| Variável | Uso |
|---|---|
| `JWT_SECRET` | Obrigatória. Segredo de assinatura dos tokens JWT. |
| `DATABASE_*` | Conexão com o PostgreSQL. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envio de e-mails pelo Resend. Sem chave, a aplicação funciona normalmente, mas não envia e-mails. |
| `EMAIL_REDIRECT_TO` | Opcional. Envia todos os e-mails para este endereço em vez do cliente (ex.: avaliação do projeto). |
| `APP_PUBLIC_URL` | Opcional. Endereço público da API usado nos links de aprovação do e-mail. |
| `WORK_ORDER_APPROVAL_TTL_HOURS` | Validade, em horas, dos links de aprovação (padrão 72). |
| `FIPE_API_TOKEN` | Opcional. Token de assinatura da API FIPE; sem ele, vale a cota pública. |

### Execução com Docker Compose

Na raiz do projeto:

```bash
# Iniciar os containers
docker compose up

# Em modo detached
docker compose up -d

# Ver logs
docker compose logs -f backend

# Parar
docker compose down
```

Ao subir, a API aplica as migrations pendentes e cria os dados de catálogo (serviços, produtos e tipos de evento). Os **usuários de demonstração** são criados pelo seed, com a API no ar:

```bash
docker compose exec backend npm run seed
```

Os seeds são separados por entidade (`roles`, `clients`, `employees` e `users`) e são idempotentes. Os documentos dos perfis seedados são fictícios, porém válidos: os dígitos verificadores conferem com os value objects `Cpf`/`Cnpj`. Se o banco já foi seedado anteriormente, o seed atualiza o documento desses perfis em vez de criar registros duplicados.

Serviços do `docker-compose.yml`:

| Serviço | Porta | Descrição |
|---|---|---|
| `backend` | 3000 | API NestJS, construída a partir do `backend/Dockerfile`, com hot reload (`nest start --watch`). Só sobe depois que o PostgreSQL está saudável (healthcheck). |
| `postgres` | 5432 | `postgres:18-alpine`, com volume persistente `postgres_data` e healthcheck. |
| `adminer` | 8080 | Interface web para consultar o banco. |
| `sonarqube`, `sonar-db` | 9000 | Análise estática. Só sobem com o profile `sonar` (ver [Qualidade e segurança](#qualidade-e-segurança)). |

Com a aplicação no ar, a documentação da API fica em <http://localhost:3000/docs>.

### Execução local (sem Docker)

```bash
cd backend

# Instalar dependências
npm install

# Configurar .env com DATABASE_HOST=localhost

# Iniciar em desenvolvimento com hot reload
npm run start:dev

# Criar os usuários de demonstração
npm run seed
```

### Migrations

As migrations rodam automaticamente quando a API sobe. Para gerenciá-las manualmente, use o TypeORM CLI:

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

## Usuários de demonstração e autenticação

Usuários criados pelo seed, todos com a senha `password123`:

| Usuário | Role |
| --- | --- |
| `jose.silveira` | `admin` |
| `quiteria.dantas` | `staff` |
| `jeremias.lopes` | `staff` |
| `agnaldo.guimaraes` | `client` |

**Request:** `POST /auth/login` (o campo `login` aceita o nome de usuário ou o e-mail)
```json
{ "login": "jose.silveira", "password": "password123" }
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "Zk3n0q8YtV1x...",
  "expiresIn": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "jose.silveira",
    "email": "jose.silveira@example.com",
    "role": "admin",
    "entityType": "employee"
  }
}
```

Envie o `accessToken` no header `Authorization: Bearer <accessToken>`; no Swagger, cole-o
em *Authorize*. Ele vale 15 minutos (`expiresIn`, em segundos). Para obter um novo, envie o
`refreshToken` em `POST /auth/refresh`; a cada renovação o refresh token anterior deixa de
valer. `POST /auth/logout` revoga o refresh token informado.

## Documentação da API

### Swagger / OpenAPI

A documentação da API está disponível em:

```
http://localhost:3000/docs
```

É a referência completa das rotas, gerada a partir do código: traz os campos de cada
requisição, os schemas de resposta, os códigos de erro e o botão *Authorize* para testar
com o token.

### Coleção do Postman

A coleção em [docs/api/oficina-mecanica.postman_collection.json](docs/api/oficina-mecanica.postman_collection.json)
tem requisições prontas para todas as rotas, com o fluxo feliz e os casos de erro, e pode ser
executada inteira pelo Collection Runner. Instruções em [docs/api](docs/api/README.md).

### Mapa da API

| Rotas | O que fazem | Quem acessa |
| --- | --- | --- |
| `/auth` | Login, renovação de token, logout e troca de senha | Público; `PATCH /auth/password` exige estar autenticado |
| `/users` | Cadastro e consulta de clientes e funcionários | `admin` e `staff` (só `admin` exclui, e `staff` não cadastra funcionários); `GET /users/me` para qualquer usuário autenticado |
| `/permissions` | Roles disponíveis e troca de role de um usuário | `admin` |
| `/vehicles` | Veículos dos clientes e consulta de preços na tabela FIPE | `admin` e `staff` |
| `/repairs` | Catálogo de serviços (tipos de reparo) | `admin` e `staff`; `client` só consulta |
| `/products` | Catálogo de peças e insumos | `admin` e `staff` |
| `/stock` | Saldo por produto e movimentações de estoque | `admin` e `staff` |
| `/work-orders` | Ordens de serviço: abertura, itens do orçamento, status, pagamento e estatísticas da OS | `admin` e `staff`; `client` consulta as próprias OS e aprova ou recusa o orçamento |
| `/work-order-approvals` | Páginas de aprovação do orçamento abertas pelo link do e-mail | Público; o token do link é a credencial (ver [Aprovação de orçamento por e-mail](#aprovação-de-orçamento-por-e-mail)) |
| `/stats` | Indicadores das ordens de serviço por período, incluindo tempos médios de execução | `admin` |
| `/events` e `/event-types` | Histórico de auditoria por entidade e catálogo dos tipos de evento | `admin` e `staff` |

## Testes

### Testes unitários

Rápidos, isolados, sem dependências externas:

```bash
cd backend

# Executar todos os testes unitários
npm run test:unit

# Executar todos os testes
npm test

# Com watch mode
npm run test:watch
```

### Cobertura

```bash
cd backend

# Cobertura de todos os testes
npm run test:cov

# Cobertura dos testes unitários (gera coverage/lcov.info, usado pelo SonarQube)
npm run test:cov:unit
```

O relatório fica em `backend/coverage/`. As evidências de testes ficam em [docs/reports](docs/reports/README.md).

### Fake repositories

Para testes unitários, os casos de uso recebem implementações em memória das mesmas interfaces usadas em produção (em `backend/test/fakes`): repositórios, Unit of Work, publicador de eventos, envio de e-mail, hash de senha e tokens.

#### Produção
```
UseCase → UserRepository → TypeOrmUserRepository → PostgreSQL
```

#### Teste
```
UseCase → UserRepository → FakeUserRepository (memória)
```

Benefícios:
- Testes unitários são rápidos e determinísticos
- Não dependem de Docker, PostgreSQL, filesystem ou rede
- Validam regras de negócio isoladamente

### Testes de integração

Validam a persistência real com PostgreSQL. São opt-in e aceitam apenas a base local
isolada `fiap_fipe_test` em `localhost:5433`. Criam e removem somente schemas temporários
`regression_*`, sem alterar tabelas existentes:

```powershell
cd backend
$env:RUN_DATABASE_INTEGRATION_TESTS = 'true'
npm run test:integration -- --runInBand
```

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

## Qualidade e segurança

### Análise de código (SonarQube)

O SonarQube roda localmente via Docker, em um profile separado para não pesar no
`docker compose up` do dia a dia:

```bash
docker compose --profile sonar up -d sonarqube
```

1. Acesse `http://localhost:9000` (login inicial `admin` / `admin`, será pedido para trocar a senha).
2. Em **My Account → Security**, gere um token do tipo *Global Analysis Token*.
3. Rode a cobertura e a análise a partir de `backend/`:

```bash
cd backend
npm run test:cov:unit          # gera coverage/lcov.info
SONAR_TOKEN=<seu-token> npm run sonar
```

No PowerShell: `$env:SONAR_TOKEN="<seu-token>"; npm run sonar`.

A configuração fica em `backend/sonar-project.properties`. As migrations ficam fora da
análise, e bootstrap, módulos, seeds e scripts de banco ficam fora da cobertura. O token
nunca deve ser versionado. A decisão está no [ADR-013](docs/adr/adr-013-analise-estatica-sonarqube.md).

### Análise de vulnerabilidades (Trivy)

O [Trivy](https://trivy.dev) roda no GitHub Actions ([.github/workflows/trivy.yml](.github/workflows/trivy.yml)) em todo PR, em push para `main`/`develop`, semanalmente e sob demanda. São dois jobs:

- **Repositório**: vulnerabilidades no `package-lock.json`, secrets commitados e misconfig de `Dockerfile`/`docker-compose.yml`
- **Imagem**: build da imagem do backend e scan de vulnerabilidades do SO base e dos pacotes Node

O pipeline falha quando há achados `HIGH` ou `CRITICAL` com correção disponível. As regras ficam em [trivy.yaml](trivy.yaml) e exceções aceitas em [.trivyignore](.trivyignore) (sempre com justificativa). A decisão está no [ADR-014](docs/adr/adr-014-analise-vulnerabilidades-trivy.md) e o resultado da análise, em [docs/reports](docs/reports/README.md).

> As actions estão fixadas por SHA de commit, e não por tag, por causa do comprometimento do `trivy-action` em março/2026 (CVE-2026-33634). Ao atualizar, resolva o SHA com `git ls-remote --tags https://github.com/aquasecurity/trivy-action`.

#### Rodando localmente

Só precisa do Docker rodando (o Trivy é executado em container). Dentro de `backend/`:

```bash
npm run security:scan        # repositório + imagem
npm run security:scan:fs     # só repositório (deps, secrets, Dockerfile/compose)
npm run security:scan:image  # build e scan da imagem do backend
```

O comando sai com código 1 se houver achados `HIGH`/`CRITICAL`. A primeira execução baixa a base de vulnerabilidades (~130 MB), que fica em cache no volume `trivy-cache`.

> O script ([backend/scripts/trivy-scan.js](backend/scripts/trivy-scan.js)) envia ao container só os arquivos versionados pelo git, em vez de montar a pasta, porque o bind mount do Docker Desktop no Windows é lento demais para percorrer o `node_modules`. Ao atualizar o Trivy, mude a versão no script e no workflow.

## Estrutura de diretórios

```
.
├── .github/workflows/          # pipeline do Trivy
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/        # WorkOrder, Product, Stock, Vehicle, User...
│   │   │   ├── value-objects/   # Cpf, Cnpj, Phone
│   │   │   ├── events/          # eventos de domínio
│   │   │   ├── repositories/    # interfaces de repositório
│   │   │   ├── errors/          # erros de domínio
│   │   │   └── types/
│   │   ├── application/
│   │   │   ├── use-cases/       # um diretório por contexto (work-orders, users, stock...)
│   │   │   ├── event-handlers/  # auditoria e notificações
│   │   │   ├── services/        # serviços de aplicação (ex.: orçamento da OS)
│   │   │   └── ports/           # e-mail, FIPE, tokens, Unit of Work, eventos...
│   │   ├── infrastructure/
│   │   │   ├── database/        # TypeORM (entidades, mappers, repositórios, migrations), seeds
│   │   │   ├── http/            # controllers, DTOs, guards, filtros, HATEOAS, páginas HTML
│   │   │   └── services/        # JWT, hash de senha, Resend, FIPE, publicação de eventos
│   │   ├── shared/              # paginação e apresentação
│   │   ├── config/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── unit/                # testes unitários (domain, application, infrastructure)
│   │   ├── integration/         # testes de persistência (opt-in)
│   │   ├── fakes/               # implementações em memória das portas
│   │   └── helpers/
│   ├── scripts/                 # script do Trivy
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   ├── jest.config.js
│   ├── tsconfig.json / tsconfig.test.json
│   └── sonar-project.properties
├── docs/                        # documentação (ver abaixo)
├── docker-compose.yml
├── trivy.yaml / .trivyignore
└── README.md
```

## Documentação DDD

A documentação de Domain-Driven Design está em [docs/ddd](docs/ddd/README.md):

- **Event Storming** dos fluxos de criação da OS, acompanhamento da OS e gestão de peças e insumos
- **Modelo de Domínio**: bounded contexts, Context Map, agregados, entidades e objetos de valor
- **Eventos de Domínio**: catálogo dos eventos publicados pelo código
- **Linguagem Ubíqua** e **Glossário**
- **Relação com o código**: como cada conceito do domínio aparece na implementação

O Event Storming foi feito no Miro: <https://miro.com/app/board/uXjVHqLxLfU=/?share_link_id=339330681728>

## Documentação

O índice completo está em [docs/README.md](docs/README.md):

| Documento | Conteúdo |
|---|---|
| [DDD](docs/ddd/README.md) | Event Storming, modelo de domínio, eventos, Linguagem Ubíqua e glossário |
| [C4](docs/c4/README.md) | Arquitetura em quatro níveis: contexto, containers, componentes e código |
| [Modelo de dados](docs/database/README.md) | DER conceitual e DER físico |
| [ADRs](docs/adr/README.md) | As 14 decisões de arquitetura |
| [API](docs/api/README.md) | Swagger, coleção do Postman e usuários de demonstração |
| [Relatórios](docs/reports/README.md) | Relatórios de testes E2E e evidências de qualidade e segurança |

## Vídeo da entrega

Link do vídeo no YouTube: _a ser adicionado_.

## Detalhes de implementação

### HATEOAS

As respostas de `products`, `repairs`, `vehicles`, `users`, `stock`, `events`,
`event-types` e `work-orders` incluem o campo `_links`
com as ações disponíveis para o recurso ([ADR-009](docs/adr/adr-009-hateoas.md)). Cada link tem `href` e `method`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Troca de óleo",
  "_links": {
    "self": { "href": "/repairs/550e8400-e29b-41d4-a716-446655440000", "method": "GET" },
    "update": { "href": "/repairs/550e8400-e29b-41d4-a716-446655440000", "method": "PUT" },
    "delete": { "href": "/repairs/550e8400-e29b-41d4-a716-446655440000", "method": "DELETE" }
  }
}
```

- **Coleções paginadas** trazem `self`, `first`, `prev`, `next` e `last`, mantendo
  `search`, `sort` e `filters` da requisição; `prev`/`next` só aparecem quando existem.
- **Links variam com a role**: um `client` em `/repairs` recebe apenas `self`, sem
  `update`, `delete` ou `create`.
- **Links variam com o estado**: produto inativo não expõe `delete`.
- **Relacionamentos**: veículo aponta para o dono (`owner`); usuário cliente aponta
  para seus veículos (`vehicles`) e para o cadastro de veículo (`add-vehicle`);
  produto aponta para seu estoque (`stock`) e movimentações (`movements`);
  movimentação aponta para produto, estoque e quem a registrou (`creator`).
- **Ordens de serviço seguem o fluxo de status**: só aparecem as próximas ações válidas
  (`start-diagnosis`, `send-quote`, `approve`/`reject`, `confirm-payment`, `start`,
  `complete`, `deliver`), todas apontando para `PATCH /work-orders/:id/status`, exceto
  `confirm-payment`. `add-item` só existe antes do envio do orçamento, e `send-quote`
  só aparece quando a OS tem itens. O cliente dono da OS recebe `approve`/`reject`
  enquanto ela aguarda aprovação; a equipe recebe também `vehicle` e `client`.
- **Histórico**: produtos, reparos, veículos, usuários, estoques e ordens de serviço têm o link `events`
  (`/events/:entityType/:entityId`); cada evento aponta para o tipo de evento e para a
  entidade de origem.
- **Listas sem paginação** (`GET /event-types` e `GET /events/...`) continuam sendo
  arrays: só os itens recebem `_links`, para não mudar o formato da resposta.

A implementação fica toda na camada HTTP (`infrastructure/http/hateoas`): cada recurso
tem um builder de links e as rotas usam `@HateoasItem(...)` ou `@HateoasCollection(...)`,
aplicados por um interceptor. Domain e Use Cases não conhecem os links.

### Proprietários de veículos e dados legados

Novos veículos exigem `user_id` de um usuário existente. O PUT altera os dados do
veículo, mas não transfere sua propriedade. IDs inválidos nas rotas retornam 400;
placas duplicadas retornam 409, inclusive em gravações concorrentes.

A migração de relacionamento preserva veículos antigos sem proprietário. Eles
continuam disponíveis para leitura com `user_id: null`, mas precisam de um dono
antes de serem atualizados. Nenhum usuário é escolhido automaticamente.

Para concluir a migração em uma base com esses registros, prepare um JSON com
todos os vínculos reais pendentes:

```json
[
  {
    "vehicleId": "UUID_DO_VEICULO",
    "userId": "UUID_DO_USUARIO"
  }
]
```

Execute dentro de `backend`, com o `.env` da base desejada:

```sh
npm run vehicles:backfill-owners -- caminho/vehicle-owners.json
```

O comando valida os IDs e os usuários, impede sobrescrever proprietários existentes
e executa tudo em uma transação. Se faltar algum vínculo, nada é gravado. Ao
finalizar, a coluna passa a ser `NOT NULL`.

O cadastro de usuário e perfil também é transacional. CPF, CNPJ numérico e CNPJ
alfanumérico têm os dígitos verificadores validados; letras do CNPJ são preservadas
em maiúsculas conforme o
[manual da Receita Federal](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj/manual-dv-cnpj.pdf).

### Consulta FIPE

`GET /vehicles/fipe/:code` consulta a FIPE API v2 da Parallelum e retorna os preços
do código informado para os anos e combustíveis disponíveis. Exemplo:

```http
GET /vehicles/fipe/001004-9
```

O backend procura o código entre automóveis, motos e caminhões e converte a resposta
para os campos `valor`, `marca`, `modelo`, `anoModelo`, `combustivel`, `codigoFipe`,
`mesReferencia`, `tipoVeiculo`, `siglaCombustivel` e `dataConsulta`.
`dataConsulta` é o instante da consulta, gerado pelo backend.

A cota pública permite consultas sem token. Opcionalmente, configure `FIPE_API_TOKEN`
no `backend/.env`; o backend envia esse valor no cabeçalho `X-Subscription-Token`.
Consulte os limites e a obtenção do token na
[documentação da Parallelum](https://deividfortuna.github.io/fipe/v2/).

Cada consulta envolve uma busca pelos anos e uma requisição de preço por ano/combustível.
As chamadas de preço têm concorrência máxima de quatro, com prazo total de dez segundos.
A API local retorna 400 para formato de código inválido, 404 para código ausente,
503 para cota externa esgotada, 504 para timeout e 502 para falha ou resposta inválida
do serviço externo.

### Aprovação de orçamento por e-mail

Quando a OS muda para `awaiting_approval`, o e-mail de orçamento enviado ao cliente
traz dois botões: **Aprovar orçamento** e **Recusar**. Os dois links usam o mesmo
token e levam a páginas HTML servidas pela própria API, sem frontend ([ADR-011](docs/adr/adr-011-aprovacao-orcamento-por-email.md)):

```http
GET  /work-order-approvals/:token/approve   # página de confirmação da aprovação
GET  /work-order-approvals/:token/reject    # página de confirmação da recusa (motivo opcional)
POST /work-order-approvals/:token/approve   # enviado pelo formulário da página: OS -> approved
POST /work-order-approvals/:token/reject    # enviado pelo formulário da página: OS -> cancelled
```

O GET só exibe o orçamento. Filtros de e-mail (Outlook Safe Links, antivírus) abrem
os links automaticamente, por isso o status só muda no POST, disparado pelo botão de
confirmação da página. O POST aceita `application/x-www-form-urlencoded` (formulário)
e `application/json`, com o campo opcional `reason`.

Regras de segurança:

- O token tem 48 bytes aleatórios; a tabela `work_order_approval_tokens` guarda apenas
  o hash SHA-256, a OS e o cliente a que ele pertence.
- A decisão é registrada em nome do cliente do token, pelo mesmo caso de uso de
  `PATCH /work-orders/:id/status` (reserva de estoque e evento de auditoria incluídos).
- O link expira em `WORK_ORDER_APPROVAL_TTL_HOURS` (padrão: 72 horas) e vale uma vez.
  Quando a OS sai de `awaiting_approval`, por link, pelo sistema ou pela equipe, os
  links pendentes são revogados na mesma transação.
- Token inexistente, expirado, usado ou de OS fora de aprovação recebe a mesma
  página "Link inválido ou expirado" (404).
- As páginas não usam JavaScript e respondem com `Content-Security-Policy`,
  `Referrer-Policy: no-referrer` e `Cache-Control: no-store`.

Os links são montados com `http://localhost:<PORT>`. Quando a API rodar em outro
endereço (ex.: deploy), defina `APP_PUBLIC_URL` no `backend/.env` com o endereço em
que o cliente acessa a API. O host da requisição não é usado, pois o cabeçalho `Host`
pode ser forjado e desviaria o token para outro site.
Com `EMAIL_REDIRECT_TO` configurada, o avaliador recebe o e-mail e pode testar o
fluxo completo pelo navegador.
