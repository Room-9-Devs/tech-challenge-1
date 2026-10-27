# Eventos de Domínio

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

| Código | Descrição | Metadados |
|---|---|---|
| `client.created` | Cliente cadastrado | `{ name, documentType, document }` |
| `client.updated` | Cliente atualizado | `{ changedFields, old, new }` |

### `employee`

| Código | Descrição | Metadados |
|---|---|---|
| `employee.created` | Colaborador cadastrado | `{ name, documentType, document, jobTitle }` |
| `employee.updated` | Colaborador atualizado | `{ changedFields, old, new }` |

### `user`

| Código | Descrição | Metadados |
|---|---|---|
| `user.created` | Conta de usuário criada | `{ username, email, role }` |
| `user.updated` | Conta de usuário atualizada | `{ changedFields, old, new }` |
| `user.password_changed` | Senha alterada | `{ changedAt }` |
| `user.role_changed` | Role do usuário alterada | `{ oldRole, newRole }` |
| `user.deleted` | Usuário excluído (exclusão lógica) | `{ username, email }` |

### `vehicle`

| Código | Descrição | Metadados |
|---|---|---|
| `vehicle.created` | Veículo cadastrado | `{ licensePlate, model, brand, year, color }` |
| `vehicle.updated` | Veículo atualizado | `{ changedFields, old, new }` |
| `vehicle.deleted` | Veículo removido | `{ licensePlate }` |
| `vehicle.associated_to_user` | Veículo vinculado a usuário | `{ userId }` |
| `vehicle.dissociated_from_user` | Veículo desvinculado de usuário | `{ userId }` |

### `product`

| Código | Descrição | Metadados |
|---|---|---|
| `product.created` | Produto cadastrado | `{ sku, name, productType, unit, cost, salePrice }` |
| `product.updated` | Produto atualizado | `{ changedFields, old, new }` |
| `product.price_changed` | Preço alterado | `{ oldCost, newCost, oldSalePrice, newSalePrice }` |

### `stock`

`stock.adjusted` é gerado a cada movimentação manual de estoque (`POST /stock/movements`). Os demais são gerados pelo fluxo de ordens de serviço: a reserva é manipulada diretamente no campo `reserved` da tabela `stocks` (sem gerar movimentação) e apenas o consumo físico na aprovação gera uma movimentação do tipo `OUT`. Esses três eventos carregam o estado do estoque antes e depois da operação, para fins de auditoria, e são gravados direto na transação da OS (ver [Automáticos](#automáticos)).

| Código | Descrição | Metadados |
|---|---|---|
| `stock.adjusted` | Movimentação manual registrada: entrada (`IN`), saída (`OUT`) ou ajuste (`ADJUSTMENT`) | `{ productId, oldQuantity, newQuantity, reason, movementId, movementType, quantity }` (`reason` é a descrição da movimentação) |
| `stock.reserved` | Reserva de estoque para a OS (transição para `awaiting_approval`); aumenta `reserved` e reduz o disponível | `{ productId, quantity, workOrderId, workOrderNumber, reservedBefore, reservedAfter, availableBefore, availableAfter }` |
| `stock.consumed` | Reserva consumida na aprovação da OS (transição para `approved`); reduz `reserved` e `quantity` fisicamente | `{ productId, quantity, workOrderId, workOrderNumber, reservedBefore, reservedAfter, availableBefore, availableAfter }` |
| `stock.released` | Reserva devolvida ao disponível no cancelamento da OS (transição para `cancelled`) | `{ productId, quantity, workOrderId, workOrderNumber, reservedBefore, reservedAfter, availableBefore, availableAfter }` |

### `repair`

| Código | Descrição | Metadados |
|---|---|---|
| `repair.created` | Serviço de reparo cadastrado | `{ description, unitValue }` |
| `repair.updated` | Serviço de reparo atualizado | `{ changedFields, old, new }` |
| `repair.deleted` | Serviço de reparo removido | `{ description, unitValue }` |

### `work_order`

| Código | Descrição | Metadados |
|---|---|---|
| `work_order.created` | Ordem de serviço criada | `{ number }` |
| `work_order.status_changed` | Status da ordem de serviço alterado | `{ from, to, reason }` |
| `work_order.payment_confirmed` | Pagamento da ordem de serviço confirmado | `{ kind }` |
| `work_order.item_added` | Item adicionado à ordem de serviço | `{ itemId, itemType, serviceId, productId, quantity, unitPrice }` |
| `work_order.item_quantity_changed` | Quantidade de item da ordem de serviço alterada | `{ itemId, itemType, serviceId, productId, quantity, unitPrice, previousQuantity, newQuantity }` |
| `work_order.item_removed` | Item removido da ordem de serviço | `{ itemId, itemType, serviceId, productId, quantity, unitPrice }` |

### `auth`

| Código | Descrição | Metadados |
|---|---|---|
| `auth.login.succeeded` | Login bem-sucedido | `{ ip, userAgent }` |
| `auth.login.failed` | Login falho | `{ username, reason, ip, userAgent }` |
| `auth.logout.succeeded` | Logout realizado | `{ userId }` |

## Eventos Automáticos vs Manuais

### Automáticos

Gerados pelos próprios casos de uso, sem chamada manual. Há duas formas de registro:

- **Por Domain Event (a maioria):** o caso de uso publica o evento de domínio pela porta `DomainEventPublisher`, e o handler de auditoria do contexto (`*-event-audit.handler.ts`) o grava na tabela `events`. Exemplos:
  - Criar usuário → `user.created`
  - Atualizar veículo → `vehicle.updated`
  - Alterar preço → `product.price_changed`
  - Mudar o status da OS → `work_order.status_changed`
- **Direto na transação da OS:** `stock.reserved`, `stock.consumed` e `stock.released` são gravados pela própria mudança de status da OS (`work-order-transaction.helpers.ts`), na mesma transação da reserva, baixa ou liberação. Assim, o histórico de estoque nunca fica divergente do saldo.

### Manuais

Registrados via endpoint `POST /events` para:

- Eventos de sistema
- Integrações externas
- Eventos que não nascem de um caso de uso existente

Regras do registro manual:

- `entityType` precisa ser um tipo de entidade válido (senão **400**);
- o tipo de evento (`eventTypeCode`) precisa existir (senão **404**);
- o tipo de evento precisa permitir o `entityType` informado (senão **400**).

## Endpoints

Todos exigem JWT e papel `admin` ou `staff`.

| Método e rota | Uso |
|---|---|
| `POST /events` | Registra um evento manualmente |
| `GET /events/:entityType/:entityId` | Lista o histórico de uma entidade |
| `POST /event-types` | Cadastra um tipo de evento |
| `GET /event-types` | Lista os tipos de evento |
| `GET /event-types/:id` | Consulta um tipo de evento |
| `PUT /event-types/:id` | Altera um tipo de evento |

## Registro de Auditoria

Todo evento armazena:

- `event_type_id`
- `entity_type` + `entity_id`
- `metadata` (JSONB)
- `note` (texto livre, opcional)
- `created_by` (username do autor, opcional)
- `created_at` (imutável)

Eventos não possuem `updated_at` nem `deleted_at` por serem registros imutáveis.

## Reações a Eventos

Além da auditoria, alguns eventos disparam reações automáticas (políticas do Event Storming):

| Evento | Condição | Reação | Handler |
|---|---|---|---|
| `work_order.status_changed` | `to = awaiting_approval` | Gera o token de aprovação e envia ao cliente o e-mail com o orçamento e os links para aprovar ou recusar | `WorkOrderNotificationHandler` |
| `work_order.status_changed` | `to = completed` | E-mail de serviço concluído para o cliente | `WorkOrderNotificationHandler` |

As notificações são best-effort: uma falha ao montar ou enviar o e-mail é registrada em log e não desfaz a mudança de status.

## Extensibilidade

Para adicionar um novo evento:

1. Inclua o código na lista deste documento.
2. Cadastre o `event_type` no `EventTypeSeedService` (`backend/src/infrastructure/database/seeds/event-type.seed.ts`), que roda na inicialização da API e cria os tipos que ainda não existem no banco.
3. Publique o evento de domínio correspondente no caso de uso, ou
4. Exponha o registro manual via `POST /events`.

Para adicionar uma nova reação a um evento existente (notificação, métrica, cache, etc.), basta criar um novo handler assinando o mesmo evento de domínio, sem alterar o caso de uso original.
