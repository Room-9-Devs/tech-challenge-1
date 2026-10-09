# Eventos do Sistema

## Visão Geral

O sistema utiliza uma tabela polimórfica `events` para registrar acontecimentos de diversas entidades. Cada evento é classificado por um `event_type` e vinculado a uma entidade via `(entity_type, entity_id)`.

A arquitetura adota **Domain Events** para gerar eventos automaticamente a partir dos casos de uso, mantendo o código desacoplado e escalável. Também existe um endpoint manual (`POST /events`) para registrar eventos do sistema ou integrações externas.

## Convenções de Código

- Formato: `{dominio}.{acao}`
- Domínio: nome da entidade ou contexto (`client`, `user`, `vehicle`, etc.)
- Ação: verbo no passado (`created`, `updated`, `deleted`, `changed`)
- Exemplos: `user.created`, `vehicle.updated`, `product.price_changed`

## Estrutura das Tabelas

### `event_types`

Catálogo de tipos de eventos disponíveis no sistema.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador único |
| `code` | varchar(50) | Código único do evento (ex: `user.created`) |
| `name` | varchar(100) | Nome legível do evento |
| `description` | varchar(255) | Descrição opcional |
| `allowed_entity_types` | event_entity_type[] | Entidades que podem emitir esse evento. Vazio = todas |
| `created_at` | timestamp | Data de criação |

### `events`

Registro imutável de cada ocorrência.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid | Identificador único |
| `event_type_id` | uuid | FK para `event_types` |
| `entity_type` | event_entity_type | Tipo da entidade relacionada |
| `entity_id` | uuid | ID da entidade relacionada |
| `note` | text | Texto livre opcional |
| `metadata` | jsonb | Dados estruturados do evento |
| `created_by` | varchar(100) | Username do autor (opcional) |
| `created_at` | timestamp | Data de ocorrência |

## Lista de Eventos

### `client`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `client.created` | Cliente cadastrado | `{ name, documentType, document }` |
| `client.updated` | Cliente atualizado | `{ changedFields, old, new }` |

### `employee`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `employee.created` | Funcionário cadastrado | `{ name, documentType, document, jobTitle }` |
| `employee.updated` | Funcionário atualizado | `{ changedFields, old, new }` |

### `user`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `user.created` | Conta de usuário criada | `{ username, email, role }` |
| `user.updated` | Conta de usuário atualizada | `{ changedFields, old, new }` |
| `user.password_changed` | Senha alterada | `{ changedAt }` |
| `user.role_changed` | Role do usuário alterada | `{ oldRole, newRole }` |

### `vehicle`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `vehicle.created` | Veículo cadastrado | `{ licensePlate, model, brand, year, color }` |
| `vehicle.updated` | Veículo atualizado | `{ changedFields, old, new }` |
| `vehicle.associated_to_user` | Veículo vinculado a usuário | `{ userId }` |
| `vehicle.dissociated_from_user` | Veículo desvinculado de usuário | `{ userId }` |

### `product`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `product.created` | Produto cadastrado | `{ sku, name, productType, unit, cost, salePrice }` |
| `product.updated` | Produto atualizado | `{ changedFields, old, new }` |
| `product.price_changed` | Preço alterado | `{ oldCost, newCost, oldSalePrice, newSalePrice }` |

### `stock`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `stock.adjusted` | Quantidade em estoque ajustada | `{ productId, oldQuantity, newQuantity, reason }` |
| `stock.reserved` | Quantidade reservada | `{ productId, quantity, reason }` |
| `stock.released` | Reserva liberada | `{ productId, quantity, reason }` |

### `repair`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `repair.created` | Serviço de reparo cadastrado | `{ description, unitValue }` |
| `repair.updated` | Serviço de reparo atualizado | `{ changedFields, old, new }` |
| `repair.deleted` | Serviço de reparo removido | `{ description, unitValue }` |

### `auth`

| Código | Descrição | Metadados sugeridos |
|---|---|---|
| `auth.login.succeeded` | Login bem-sucedido | `{ ip, userAgent }` |
| `auth.login.failed` | Login falho | `{ username, reason }` |
| `auth.logout.succeeded` | Logout realizado | `{ userId }` |

## Eventos Automáticos vs Manuais

### Automáticos

Gerados por handlers de Domain Events após ações nos casos de uso. Exemplos:

- Criar usuário → `user.created`
- Atualizar veículo → `vehicle.updated`
- Alterar preço → `product.price_changed`

### Manuais

Registrados via endpoint `POST /events` para:

- Eventos de sistema
- Integrações externas
- Eventos que não nascem de um caso de uso existente

## Registro de Auditoria

Todo evento armazena:

- `event_type_id`
- `entity_type` + `entity_id`
- `metadata` (JSONB)
- `note` (texto livre, opcional)
- `created_by` (username do autor, opcional)
- `created_at` (imutável)

Eventos não possuem `updated_at` nem `deleted_at` por serem registros imutáveis.

## Extensibilidade

Para adicionar um novo evento:

1. Inclua o código na lista deste documento.
2. Crie ou reaproveite o `event_type` na migration/seed.
3. Publique o evento de domínio correspondente no caso de uso, ou
4. Exponha o registro manual via `POST /events`.

Para adicionar uma nova reação a um evento existente (notificação, métrica, cache, etc.), basta criar um novo handler assinando o mesmo evento de domínio, sem alterar o caso de uso original.
