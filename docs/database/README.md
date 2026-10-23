# Modelo de Dados

Modelo de dados do **Sistema de Gestão da Oficina Mecânica** (PostgreSQL 18). O schema é criado e versionado pelas migrations do TypeORM em [`backend/src/infrastructure/database/typeorm/migrations`](../../backend/src/infrastructure/database/typeorm/migrations) (`synchronize: false`), que são a fonte deste documento.

O documento tem duas visões:

1. **[DER conceitual](#1-der-conceitual):** entidades e relacionamentos, com cardinalidade, sem colunas.
2. **[DER físico](#2-der-físico):** as 16 tabelas, como existem no PostgreSQL, com colunas, tipos, chaves e constraints.

## Escopos

As cores separam as tabelas por escopo, nos dois diagramas:

| Cor | Escopo | Tabelas |
|---|---|---|
| Verde | Permissão de acesso | `roles` |
| Cinza | Usuário de login | `users`, `refresh_tokens` |
| Azul | Dados cadastrais (tipo do usuário) | `clients`, `employees` |
| Roxo | Ordem de Serviço (domínio principal) | `work_orders`, `work_order_items`, `work_order_approval_tokens`, `work_order_number_sequences` |
| Ciano | Objetos do domínio principal (dependências do serviço realizado) | `vehicles`, `repairs`, `products` |
| Laranja | Controle de estoque | `stocks`, `stock_movements` |
| Vermelho | Event Store | `event_types`, `events` |

## 1. DER conceitual

```mermaid
erDiagram
  roles["Papel"]
  users["Usuário"]
  clients["Cliente"]
  employees["Colaborador"]
  refresh_tokens["Refresh Token"]
  vehicles["Veículo"]
  repairs["Serviço"]
  products["Peça ou Insumo"]
  stocks["Estoque"]
  stock_movements["Movimentação de Estoque"]
  work_orders["Ordem de Serviço"]
  work_order_items["Item da OS"]
  work_order_approval_tokens["Token de Aprovação"]
  event_types["Tipo de Evento"]
  events["Evento"]

  roles ||--o{ users : "define o acesso de"
  clients |o..|| users : "acessa como"
  employees |o..|| users : "acessa como"
  users ||--o{ refresh_tokens : "possui"
  users ||--o{ vehicles : "é dono de"
  vehicles ||--o{ work_orders : "recebe"
  users ||--o{ work_orders : "é cliente de"
  work_orders ||--o{ work_order_items : "contém"
  repairs |o--o{ work_order_items : "é cobrado em"
  products |o--o{ work_order_items : "é usado em"
  work_orders ||--o{ work_order_approval_tokens : "gera"
  products ||--|| stocks : "tem saldo em"
  products ||--o{ stock_movements : "é movimentado em"
  users ||--o{ stock_movements : "registra"
  event_types ||--o{ events : "classifica"

  classDef acesso fill:#b2f2bb,stroke:#2f9e44,color:#1b4332
  classDef login fill:#f1f3f5,stroke:#212529,color:#212529
  classDef cadastrais fill:#a5d8ff,stroke:#1971c2,color:#0b3d6e
  classDef os fill:#e5dbff,stroke:#6741d9,color:#3b1f8f
  classDef objetos fill:#c5f6fa,stroke:#0c8599,color:#0b4f5c
  classDef estoque fill:#ffd8a8,stroke:#e8590c,color:#7a2e00
  classDef eventos fill:#ffc9c9,stroke:#e03131,color:#7a1414
  class roles acesso
  class users,refresh_tokens login
  class clients,employees cadastrais
  class work_orders,work_order_items,work_order_approval_tokens os
  class vehicles,repairs,products objetos
  class stocks,stock_movements estoque
  class event_types,events eventos
```

> **Imagem:** [der-conceitual.png](der-conceitual.png), com fundo branco e a legenda de escopos.
>
> **Notação:** pé de galinha (crow's foot). `||` = exatamente um, `|o` = zero ou um, `o{` = zero ou mais. A linha tracejada é uma referência **sem chave estrangeira** (ver [Referências polimórficas](#referências-polimórficas)).
>
> Para não poluir o diagrama, ficaram de fora: o vínculo de `Evento` com a entidade auditada (polimórfico, vale para quase todas as entidades), o colaborador que abriu a OS (`work_orders.created_by`) e a referência da movimentação de estoque à OS que a originou. Todos estão no [DER físico](#2-der-físico).

### Entidades

| Entidade | Tabela | Descrição |
|---|---|---|
| Papel | `roles` | Papel de acesso: `admin`, `staff`, `client`. |
| Usuário | `users` | Credencial de acesso. Aponta para o perfil de Cliente ou de Colaborador. |
| Cliente / Colaborador | `clients` / `employees` | Dados cadastrais do perfil (nome, CPF/CNPJ, telefone). |
| Refresh Token | `refresh_tokens` | Sessão de login renovável. |
| Veículo | `vehicles` | Veículo do cliente (placa, marca, modelo, ano). |
| Serviço | `repairs` | Catálogo de serviços da oficina, com valor unitário. |
| Peça ou Insumo | `products` | Catálogo de peças (`PART`) e insumos (`CONSUMABLE`). |
| Estoque | `stocks` | Saldo atual de cada produto: quantidade e reservado. |
| Movimentação de Estoque | `stock_movements` | Histórico de entradas, saídas e ajustes. |
| Ordem de Serviço | `work_orders` | OS de um veículo, com status e valor total. |
| Item da OS | `work_order_items` | Serviço ou peça/insumo incluído no orçamento da OS. |
| Token de Aprovação | `work_order_approval_tokens` | Link de uso único enviado por e-mail para aprovar ou recusar o orçamento. |
| Tipo de Evento / Evento | `event_types` / `events` | Histórico de auditoria (Event Store) de todas as entidades. |

A tabela técnica `work_order_number_sequences` (contador do número da OS) não é uma entidade do domínio e aparece só no DER físico.

## 2. DER físico

```mermaid
---
config:
  themeVariables:
    rowOdd: "#ffffff"
    rowEven: "#ffffff"
    attributeBackgroundColorOdd: "#ffffff"
    attributeBackgroundColorEven: "#ffffff"
---
erDiagram
  roles {
    uuid id PK
    varchar(100) name
    varchar(50) slug UK
    timestamp created_at
    timestamp updated_at
  }
  users {
    uuid id PK
    varchar(100) username UK "único entre ativos"
    varchar(255) email UK "único entre ativos"
    text password "hash scrypt"
    varchar(20) entity_type "client ou employee"
    uuid entity_id "clients.id ou employees.id (sem FK)"
    uuid role_id FK
    timestamp created_at
    timestamp updated_at
    timestamp deleted_at "exclusão lógica"
  }
  clients {
    uuid id PK
    varchar(150) name
    document_type document_type "CPF ou CNPJ"
    varchar(14) document UK
    varchar(11) phone "10 ou 11 dígitos"
    timestamp created_at
    timestamp updated_at
  }
  employees {
    uuid id PK
    varchar(150) name
    document_type document_type "CPF ou CNPJ"
    varchar(14) document UK
    varchar(150) job_title "opcional"
    varchar(11) phone "10 ou 11 dígitos"
    timestamp created_at
    timestamp updated_at
  }
  refresh_tokens {
    uuid id PK
    uuid user_id FK "ON DELETE CASCADE"
    text token_hash UK
    timestamp expires_at
    timestamp revoked_at "opcional"
    timestamp created_at
    timestamp updated_at
  }
  vehicles {
    uuid id PK
    uuid user_id FK "dono; ON DELETE CASCADE"
    varchar(7) license_plate UK
    varchar(100) model
    varchar(100) brand
    integer year
    varchar(50) color
    timestamp created_at
    timestamp updated_at
  }
  repairs {
    uuid id PK
    varchar(255) description UK "única entre ativos"
    numeric unit_value "(10,2)"
    timestamp created_at
    timestamp updated_at
    timestamp deleted_at "exclusão lógica"
  }
  products {
    uuid id PK
    varchar(100) sku UK
    varchar(255) name
    varchar(255) description "opcional"
    products_product_type_enum product_type "PART ou CONSUMABLE"
    products_unit_enum unit "UNIT, LITER, KILOGRAM, METER"
    numeric cost "(10,2)"
    numeric sale_price "(10,2)"
    boolean active "padrão true"
    timestamp created_at
    timestamp updated_at
  }
  stocks {
    uuid id PK
    uuid product_id FK,UK
    integer quantity ">= 0"
    integer reserved ">= 0 e <= quantity"
    timestamp created_at
    timestamp updated_at
  }
  stock_movements {
    uuid id PK
    uuid product_id FK
    integer quantity ">= 0"
    integer previous_quantity ">= 0; opcional"
    stock_movements_movement_type_enum movement_type "IN, OUT, ADJUSTMENT"
    text description "opcional"
    varchar(50) reference_type "ex.: work_order; opcional"
    uuid reference_id "sem FK; opcional"
    uuid created_by FK
    timestamp created_at
  }
  work_order_number_sequences {
    integer year PK
    integer last_number ">= 0"
  }
  work_orders {
    uuid id PK
    varchar(32) number UK "OS-0001/2026"
    varchar(32) status "CHECK: 8 status"
    uuid vehicle_id FK "ON DELETE RESTRICT"
    uuid client_id FK "users.id; ON DELETE RESTRICT"
    uuid created_by FK "users.id; ON DELETE RESTRICT"
    text observations "opcional"
    numeric total_price "(12,2); padrão 0"
    timestamp created_at
    timestamp updated_at
  }
  work_order_items {
    uuid id PK
    uuid work_order_id FK "ON DELETE CASCADE"
    numeric quantity "(12,3); > 0"
    numeric unit_price "(10,2); >= 0"
    uuid service_id FK "repairs.id; ON DELETE RESTRICT"
    uuid product_id FK "ON DELETE RESTRICT"
    timestamp created_at
    timestamp updated_at
  }
  work_order_approval_tokens {
    uuid id PK
    uuid work_order_id FK "ON DELETE CASCADE"
    uuid client_id FK "users.id; ON DELETE CASCADE"
    text token_hash UK "SHA-256"
    timestamp expires_at
    timestamp used_at "opcional"
    timestamp revoked_at "opcional"
    timestamp created_at
  }
  event_types {
    uuid id PK
    varchar(50) code UK
    varchar(100) name
    varchar(255) description "opcional"
    event_entity_type[] allowed_entity_types "padrão vazio"
    timestamp created_at
  }
  events {
    uuid id PK
    uuid event_type_id FK
    event_entity_type entity_type
    uuid entity_id "sem FK"
    text note "opcional"
    jsonb metadata "opcional"
    varchar(100) created_by "username; sem FK"
    timestamp created_at
  }

  roles ||--o{ users : "role_id"
  clients |o..|| users : "entity_id"
  employees |o..|| users : "entity_id"
  users ||--o{ refresh_tokens : "user_id"
  users ||--o{ vehicles : "user_id"
  vehicles ||--o{ work_orders : "vehicle_id"
  users ||--o{ work_orders : "client_id"
  users ||--o{ work_orders : "created_by"
  work_orders ||--o{ work_order_items : "work_order_id"
  repairs |o--o{ work_order_items : "service_id"
  products |o--o{ work_order_items : "product_id"
  work_orders ||--o{ work_order_approval_tokens : "work_order_id"
  users ||--o{ work_order_approval_tokens : "client_id"
  products ||--|| stocks : "product_id"
  products ||--o{ stock_movements : "product_id"
  users ||--o{ stock_movements : "created_by"
  work_orders |o..o{ stock_movements : "reference_id"
  event_types ||--o{ events : "event_type_id"

  classDef acesso fill:#b2f2bb,stroke:#2f9e44,color:#1b4332
  classDef login fill:#f1f3f5,stroke:#212529,color:#212529
  classDef cadastrais fill:#a5d8ff,stroke:#1971c2,color:#0b3d6e
  classDef os fill:#e5dbff,stroke:#6741d9,color:#3b1f8f
  classDef objetos fill:#c5f6fa,stroke:#0c8599,color:#0b4f5c
  classDef estoque fill:#ffd8a8,stroke:#e8590c,color:#7a2e00
  classDef eventos fill:#ffc9c9,stroke:#e03131,color:#7a1414
  class roles acesso
  class users,refresh_tokens login
  class clients,employees cadastrais
  class work_orders,work_order_items,work_order_approval_tokens,work_order_number_sequences os
  class vehicles,repairs,products objetos
  class stocks,stock_movements estoque
  class event_types,events eventos
```

> **Imagem:** [der-fisico.png](der-fisico.png), com fundo branco e a legenda de escopos (alta resolução, para ampliar).
>
> **Notação:** `PK` = chave primária, `FK` = chave estrangeira, `UK` = único. Os tipos seguem o PostgreSQL; a precisão de `numeric` aparece no comentário, ex.: `(10,2)`. Os `timestamp` são `NOT NULL DEFAULT now()`, exceto os marcados como opcionais.

## 3. Regras do schema

### Referências polimórficas

Três colunas apontam para mais de uma tabela e, por isso, **não têm chave estrangeira**. A integridade é garantida pela aplicação.

| Coluna | Aponta para | Discriminador |
|---|---|---|
| `users.entity_id` | `clients.id` ou `employees.id` | `users.entity_type` (`client`, `employee`), com índice em `(entity_type, entity_id)` |
| `events.entity_id` | a entidade auditada (`client`, `employee`, `user`, `vehicle`, `product`, `stock`, `repair`, `work_order`) | `events.entity_type`, com índice em `(entity_type, entity_id)` |
| `stock_movements.reference_id` | o registro que originou a movimentação (ex.: a OS, no consumo de peças) | `stock_movements.reference_type` |

Além disso, `events.created_by` guarda o **username** de quem gerou o evento, como texto e sem chave estrangeira. A FK para `users(username)` existia e foi removida junto com a introdução da exclusão lógica: o username deixou de ser único em toda a tabela (só entre ativos), e o registro de auditoria precisa manter o valor original.

### Constraints de negócio

| Tabela | Regra |
|---|---|
| `work_orders` | `status` ∈ `received`, `under_diagnosis`, `awaiting_approval`, `approved`, `in_progress`, `completed`, `delivered`, `cancelled` |
| `work_order_items` | Exatamente um entre `service_id` e `product_id` é preenchido; `quantity > 0`; `unit_price >= 0` |
| `stocks` | `quantity >= 0`, `reserved >= 0` e `reserved <= quantity`; um saldo por produto (`product_id` único) |
| `stock_movements` | `quantity >= 0` e `previous_quantity >= 0` |
| `clients`, `employees` | `phone` com 10 ou 11 dígitos; `document` único |
| `users` | `entity_type` ∈ `client`, `employee` |

### Exclusão lógica

`users` e `repairs` têm `deleted_at`. A unicidade de `users.username`, `users.email` e `repairs.description` vale só entre os registros ativos (índices únicos parciais com `WHERE deleted_at IS NULL`), para que um registro excluído não bloqueie um novo com o mesmo valor.

### Numeração da OS

`work_order_number_sequences` guarda o último número usado em cada ano. O número da OS (`OS-0001/2026`) é gerado com um `INSERT ... ON CONFLICT DO UPDATE` atômico nessa tabela, sem risco de duplicidade em criações simultâneas.

### Índices

Além das chaves primárias e dos únicos:

- `users (entity_type, entity_id)`, `refresh_tokens (user_id)`;
- `work_orders (status, created_at)` e `work_orders (client_id, created_at)`, usados nas listagens e nos indicadores;
- `work_order_items (work_order_id)`, `work_order_approval_tokens (work_order_id)`;
- `events (entity_type, entity_id)`, `events (event_type_id)`, `events (created_at DESC)` e índice GIN em `events (metadata)`.

## 4. Relação com o domínio

| Agregado / conceito | Tabelas |
|---|---|
| Ordem de Serviço (raiz) | `work_orders`, `work_order_items`, `work_order_approval_tokens`, `work_order_number_sequences` |
| Estoque | `products`, `stocks`, `stock_movements` |
| Cadastros | `vehicles`, `repairs` |
| Identidade e Acesso | `users`, `clients`, `employees`, `roles`, `refresh_tokens` |
| Histórico de Eventos | `event_types`, `events` |

## Referências

- [ADR-002 — Escolha do Banco de Dados Principal](../adr/adr-002-banco-dados.md)
- [ADR-004 — Escolha do ORM da Aplicação](../adr/adr-004-escolha-orm.md)
- [ADR-008 — Eventos de Domínio e Registro de Auditoria](../adr/adr-008-eventos-dominio-auditoria.md)
- [C4 — Nível 2: Diagrama de Containers](../c4/02-container.md)
