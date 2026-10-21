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

Os documentos dos perfis seedados são fictícios, porém válidos: os dígitos verificadores conferem com os value objects `Cpf`/`Cnpj`. Se o banco já foi seedado anteriormente, o seed atualiza o documento desses perfis em vez de criar registros duplicados.

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

## Análise de código (SonarQube)

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
nunca deve ser versionado.
## Segurança (Trivy)

O [Trivy](https://trivy.dev) roda no GitHub Actions ([.github/workflows/trivy.yml](.github/workflows/trivy.yml)) em todo PR, em push para `main`/`develop`, semanalmente e sob demanda. São dois jobs:

- **Repositório**: vulnerabilidades no `package-lock.json`, secrets commitados e misconfig de `Dockerfile`/`docker-compose.yml`
- **Imagem**: build da imagem do backend e scan de vulnerabilidades do SO base e dos pacotes Node

O pipeline falha quando há achados `HIGH` ou `CRITICAL` com correção disponível. As regras ficam em [trivy.yaml](trivy.yaml) e exceções aceitas em [.trivyignore](.trivyignore) (sempre com justificativa).

> As actions estão fixadas por SHA de commit, e não por tag, por causa do comprometimento do `trivy-action` em março/2026 (CVE-2026-33634). Ao atualizar, resolva o SHA com `git ls-remote --tags https://github.com/aquasecurity/trivy-action`.

### Rodando localmente

Só precisa do Docker rodando (o Trivy é executado em container). Dentro de `backend/`:

```bash
npm run security:scan        # repositório + imagem
npm run security:scan:fs     # só repositório (deps, secrets, Dockerfile/compose)
npm run security:scan:image  # build e scan da imagem do backend
```

O comando sai com código 1 se houver achados `HIGH`/`CRITICAL`. A primeira execução baixa a base de vulnerabilidades (~130 MB), que fica em cache no volume `trivy-cache`.

> O script ([backend/scripts/trivy-scan.js](backend/scripts/trivy-scan.js)) envia ao container só os arquivos versionados pelo git, em vez de montar a pasta, porque o bind mount do Docker Desktop no Windows é lento demais para percorrer o `node_modules`. Ao atualizar o Trivy, mude a versão no script e no workflow.

## Swagger / OpenAPI

A documentação da API está disponível em:

```
http://localhost:3000/docs
```

## Endpoints

A referência completa das rotas é o Swagger (`/docs`), gerado a partir do código: ele
traz os campos de cada requisição, os schemas de resposta, os códigos de erro e o botão
*Authorize* para testar com o token. A coleção Postman em
[docs/oficina-mecanica.postman_collection.json](docs/oficina-mecanica.postman_collection.json)
tem requisições prontas, incluindo casos de erro.

### Autenticação

Usuários de demonstração, criados pelo seed, todos com a senha `password123`:

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

## HATEOAS

As respostas de `products`, `repairs`, `vehicles`, `users`, `stock`, `events`,
`event-types` e `work-orders` incluem o campo `_links`
com as ações disponíveis para o recurso. Cada link tem `href` e `method`:

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

## Proprietários de veículos e dados legados

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

### Testes de persistência

Os testes unitários não exigem banco. Os testes de integração são opt-in e aceitam
apenas a base local isolada `fiap_fipe_test` em `localhost:5433`. Criam e removem
somente schemas temporários `regression_*`, sem alterar tabelas existentes:

```powershell
$env:RUN_DATABASE_INTEGRATION_TESTS = 'true'
npm run test:integration -- --runInBand
```

## Consulta FIPE

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

## Aprovação de orçamento por e-mail

Quando a OS muda para `awaiting_approval`, o e-mail de orçamento enviado ao cliente
traz dois botões: **Aprovar orçamento** e **Recusar**. Os dois links usam o mesmo
token e levam a páginas HTML servidas pela própria API, sem frontend:

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
  links pendentes são revogados na mesma transação. Reenviar o orçamento revoga os
  links anteriores.
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
