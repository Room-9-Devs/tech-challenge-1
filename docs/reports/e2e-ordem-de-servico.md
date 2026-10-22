# Relatório E2E — Fluxo completo da Ordem de Serviço com reservas de estoque

> **Data da execução:** 16/10/2026 (03:50–03:56 UTC)
> **Ambiente:** Docker local (`backend` NestJS :3000, `postgres` 18-alpine, `adminer`), volume do Postgres **resetado do zero** antes da execução
> **Método:** requisições HTTP via `curl`/`fetch` na API (`http://localhost:3000`), com eventos validados em `GET /events/{entidade}/{id}` e estado do estoque em `GET /stock`
> **Escopo:** fluxo completo de duas OS cobrindo o novo modelo de reserva — `stock.reserved` no envio do orçamento (reserva direta na tabela `stocks`, sem movement), `stock.consumed` + movement **OUT** na aprovação e `stock.released` no cancelamento (sem movement).
> **Documentação de eventos:** [`docs/ddd/eventos-de-dominio.md`](../ddd/eventos-de-dominio.md) (seção `stock`, atualizada neste mesmo PR)

---

## 1. Sumário do resultado

| Item | Valor |
|---|---|
| **OS A (fluxo feliz)** | `OS-0001/2026` — id `058ef06d-4b5a-48a5-b960-12461c10b1f7` — status final **`delivered`** ✅ |
| **OS B (cancelamento)** | `OS-0002/2026` — id `2b07c613-f41c-422c-959a-e0f088bc8e60` — status final **`cancelled`** ✅ |
| **OS C (teste negativo)** | `OS-0003/2026` — usada apenas para validar estoque insuficiente (409) |
| **Cliente** | Agnaldo Guimarães (`agnaldo.guimaraes@example.com`) |
| **Veículo** | Chevrolet Onix 2020 Prata — placa `AGN1A22` (criado nesta execução) |
| **Aberta por** | `quiteria.dantas` (staff) |
| **Total OS A** | **R$ 648,00** (serviço R$ 450 + velas 4× R$ 32 + filtro de óleo 2× R$ 35) |
| **Total OS B** | **R$ 98,00** (filtro de ar do motor 2× R$ 49) |

## 2. Atores e preparação de ambiente

| Perfil | Usuário | Papel |
|---|---|---|
| Admin | `jose.silveira` | `admin` — reposição de estoque |
| Staff | `quiteria.dantas` | `staff` — abertura da OS, itens, transições de status, aprovação e pagamento |
| Cliente | `agnaldo.guimaraes` | `client` — participante do fluxo de orçamento |

- **Reset do banco:** `docker compose down -v && up -d` para eliminar resíduos da branch descartada (valores RESERVE/RELEASE/CONSUME no enum do Postgres, event_type `stock_movement.created` e movements órfãs).
- **Migrations:** aplicadas automaticamente no boot do container fresh (16 migrations, incluindo os tipos do enum `stock_movements_movement_type_enum` = IN/OUT/ADJUSTMENT apenas).
- **Seeds no boot:** 12 serviços (`RepairSeedService`), 18 produtos (`ProductSeedService`) e 7 tipos de evento novos (`EventTypeSeedService` — entre eles `stock.consumed`).
- **Seed manual:** `npm run seed:container` foi executado para popular `roles`, `clients`, `employees` e `users` (o seed de usuários roda a partir de `run-seeds.ts`, não no bootstrap da aplicação).
- **E-mails:** `EMAIL_REDIRECT_TO=michelMLG@outlook.com` ativa no container (aviso `ResendEmailSender` no boot). Nenhum `WARN`/`ERROR` de notificação em toda a execução → e-mails de orçamento (etapa 4) e conclusão (etapa 8) enviados com sucesso (senders só registram log em falha).

## 3. Itens das OS

| Tipo | Item | SKU/ID | Qtd | Unit (R$) | Subtotal (R$) |
|---|---|---|---:|---:|---:|
| Serviço (OS A) | Revisão completa | `02bd5f20…` | 1 | 450,00 | 450,00 |
| Produto (OS A) | Vela de ignição | `VELA-IGNICAO-01` | 4 | 32,00 | 128,00 |
| Produto (OS A) | Filtro de óleo | `FILTRO-OLEO-01` | 2 | 35,00 | 70,00 |
| Produto (OS B) | Filtro de ar do motor | `FILTRO-AR-01` | 2 | 49,00 | 98,00 |

Preparação de estoque (admin, `POST /stock/movements` tipo `IN`): +20 velas, +20 filtros de óleo, +10 filtros de ar. Estoque inicial de todos os produtos: 0.

## 4. Timeline do cenário A — fluxo feliz

### Etapa 0 — Preparação
- `POST /stock/movements` ×2 (`IN` 20 velas e 20 filtros de óleo) → **201**
- Estoque resultante: velas 20 (reserved 0) | filtro de óleo 20 (reserved 0)
- Eventos: 2× `stock.adjusted` com metadata `{productId, oldQuantity: 0, newQuantity: 20, movementType: "IN", movementId}`

### Etapa 1 — Criação da OS
- `POST /work-orders` (staff) → **201**, status inicial `received`
- Evento: `work_order.created` `{number: "OS-0001/2026"}`

### Etapa 2 — Montagem do orçamento
- `POST /work-orders/:id/items` ×3 (staff) → **201** (total recalculando: 450 → 578 → 648; preço unitário congelado do catálogo)
- **Estoque: sem alteração nesta fase** (velas 20/0, filtro 20/0)
- Eventos: 3× `work_order.item_added` `{itemId, itemType, quantity, productId|serviceId, unitPrice}`

### Etapa 3 — Diagnóstico
- `PATCH /work-orders/:id/status` `{status:"under_diagnosis"}` → **200**
- Evento: `work_order.status_changed` `{from:"received", to:"under_diagnosis"}`

### Etapa 4 — Envio do orçamento  (🔥 nova mecânica de reserva)
- `PATCH /work-orders/:id/status` `{status:"awaiting_approval"}` → **200**
- **Estoque:** `reserved` manipulado diretamente na tabela `stocks` — velas 20 → **reserved 4** (available 16), filtro → **reserved 2** (available 18); `quantity` intacta
- **Sem movement** gerado para a reserva (o histórico de movimentações dos produtos segue apenas com os `IN` da reposição)
- Eventos por produto: `stock.reserved` com metadata completa:
  ```json
  {"productId":"2a8b9ad5…","quantity":4,"workOrderId":"058ef06d…","workOrderNumber":"OS-0001/2026",
   "reservedBefore":0,"reservedAfter":4,"availableBefore":20,"availableAfter":16}
  ```
- **E-mail** de orçamento disparado ao cliente (best-effort, sem warnings no log)

### Etapa 5 — Aprovação  (🔥 consumo com evento novo)
- **Teste de papel:** `staff` pode aprovar (200) e o cliente só pode aprovar/recusar **a própria OS em `awaiting_approval`** — cliente tentando transicionar a OS já aprovada → **403** `Cliente só pode aprovar ou recusar o orçamento da própria OS`
- **Estoque:** baixa física consolidada — velas 20 → **quantity 16** (reserved → 0), filtro → **quantity 18** (reserved → 0); `available` permanece igual (16/18) porque o físico consumido era justamente a parcela reservada
- **Movement `OUT`** criada em `stock_movements` por produto (histórico do catálogo):
  ```json
  {"movementType":"OUT","quantity":4,"previousQuantity":20,"referenceType":"work_order","referenceId":"058ef06d…","createdBy":"quiteria.dantas"}
  ```
- Eventos por produto: `stock.consumed` com metadata completa:
  ```json
  {"productId":"2a8b9ad5…","quantity":4,"workOrderId":"058ef06d…","workOrderNumber":"OS-0001/2026",
   "reservedBefore":4,"reservedAfter":0,"availableBefore":16,"availableAfter":16}
  ```

### Etapa 6 — Confirmação de pagamento
- `PATCH /work-orders/:id/status` `{status:"in_progress"}` **sem pagamento** → **409** `Confirme o pagamento antes de iniciar o serviço` (trava validada)
- `POST /work-orders/:id/payment-confirmation` `{note:"PIX recebido em 16/10/2026"}` → **200** `{workOrderId, confirmed:true}`
- Evento: `work_order.payment_confirmed`

### Etapas 7–9 — Execução, conclusão e entrega
- `PATCH` `in_progress` → **200** | `completed` → **200** | `delivered` → **200**
- Eventos: 3× `work_order.status_changed` (`approved → in_progress → completed → delivered`)- **E-mail** de conclusão disparado (template `work-order-completed`)

### Timeline consolidada de eventos da OS A (cronológica, via `GET /events/work_order/:id`)

| # | Timestamp (UTC) | Evento | Autor |
|---|---|---|---|
| 1 | 2026-10-16T03:53:00.617Z | `work_order.created` | quiteria.dantas |
| 2–4 | 03:53:06.393–482 | 3× `work_order.item_added` | quiteria.dantas |
| 5 | 03:53:11.901Z | `work_order.status_changed` (received → under_diagnosis) | quiteria.dantas |
| 6 | 03:53:16.494Z | `work_order.status_changed` (under_diagnosis → awaiting_approval) | quiteria.dantas |
| 7 | 03:53:32.468Z | `work_order.status_changed` (awaiting_approval → approved) | quiteria.dantas |
| 8 | 03:54:00.169Z | `work_order.payment_confirmed` | quiteria.dantas |
| 9 | 03:54:00.218Z | `work_order.status_changed` (approved → in_progress) | quiteria.dantas |
| 10 | 03:54:00.257Z | `work_order.status_changed` (in_progress → completed) | quiteria.dantas |
| 11 | 03:54:00.723Z | `work_order.status_changed` (completed → delivered) | quiteria.dantas |

Eventos associados ao **estoque** da OS A (via `GET /events/stock/{stockId}`): 2× `stock.reserved` (etapa 4) + 2× `stock.consumed` (etapa 5), além dos `stock.adjusted` da reposição.

## 5. Timeline do cenário B — cancelamento  (🔥 `stock.released` sem movement)

| Etapa | Ação | Resultado |
|---|---|---|
| 1 | `POST /stock/movements` `IN` +10 filtro de ar (admin) | **201**; estoque 10/0 |
| 2 | `POST /work-orders` + item 2× filtro de ar (staff) | **201**; OS-0002/2026, total R$ 98 |
| 3 | `PATCH` `under_diagnosis` → `awaiting_approval` | **200**; estoque: **reserved 2**, quantity 10 |
| 4 | `PATCH` `cancelled` (staff) | **200**; estoque: **reserved → 0**, quantity 10 intacta, **available de volta a 10** |
| 5 | `GET /stock/movements` do produto | apenas **1 movement `IN`** (reposição) — **nenhuma movement gerada pela reserva/liberação** |

Eventos de estoque do produto (ordem cronológica):
```json
{"eventType":"stock.adjusted","metadata":{"oldQuantity":0,"newQuantity":10,"movementType":"IN"}}
{"eventType":"stock.reserved","metadata":{"quantity":2,"workOrderNumber":"OS-0002/2026","reservedBefore":0,"reservedAfter":2,"availableBefore":10,"availableAfter":8}}
{"eventType":"stock.released","metadata":{"quantity":2,"workOrderNumber":"OS-0002/2026","reservedBefore":2,"reservedAfter":0,"availableBefore":8,"availableAfter":10}}
```

## 6. Testes negativos validados

1. **Estoque insuficiente no orçamento** (`OS-0003/2026`): adicionar 20 velas com disponível 16 → **409** `Saldo insuficiente em estoque` (e 15 unidades passam, validando o limite exato).
2. **Cliente fora do escopo**: cliente tentou transicionar OS já aprovada → **403** `Cliente só pode aprovar ou recusar o orçamento da própria OS`.
3. **Trava de pagamento**: `approved → in_progress` sem pagamento confirmado → **409** `Confirme o pagamento antes de iniciar o serviço`.

## 7. Estado final do estoque

| Produto | quantity | reserved | available | Movements totais |
|---|---:|---:|---:|---|
| Vela de ignição | 16 | 0 | 16 | 1× IN(20), 1× OUT(4) |
| Filtro de óleo | 18 | 0 | 18 | 1× IN(20), 1× OUT(2) |
| Filtro de ar do motor | 10 | 0 | 10 | 1× IN(10) |

## 8. Regras de negócio validadas nesta execução

1. **Reserva direta na tabela** — `awaiting_approval` apenas incrementa `stocks.reserved` (não gera `stock_movements`); o disponível se reduz por `quantity - reserved`.
2. **Único movement gerado pelo fluxo de OS é `OUT`** — gravado só na aprovação (consumo físico consolidado), com `referenceType="work_order"` e `referenceId` da OS.
3. **Eventos de estoque enriquecidos** — `stock.reserved`, `stock.consumed` e `stock.released` gravados com `workOrderId`, `workOrderNumber`, `reservedBefore/After` e `availableBefore/After`; autor (`createdBy`) rastreável.
4. **Cancelamento devolve o saldo** — `cancelled` em `awaiting_approval` restaura `available` sem alterar `quantity` e sem movement.
5. **Preço congelado** — `unitPrice` capturado do catálogo na adição do item.
6. **Travas de papel e pagamento** — conforme seção 6.
7. **Auditoria completa** — 11 eventos de OS no cenário A + 8 eventos de estoque nos dois cenários, todos com timestamp, autor e metadata.

## 9. Requests de referência (reexecução)

```bash
# Login
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"login":"quiteria.dantas","password":"password123"}'

# Reposição de estoque (admin)
curl -s -X POST http://localhost:3000/stock/movements -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<ID>","quantity":20,"movementType":"IN","description":"Reposição inicial"}'

# Criar veículo (owner é o client_id interno; endpoint é POST /vehicles/:user_id)
curl -s -X POST http://localhost:3000/vehicles/<USER_ID> -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"license_plate":"AGN1A22","brand":"Chevrolet","model":"Onix","year":2020,"color":"Prata"}'

# Criar OS
curl -s -X POST http://localhost:3000/work-orders -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -d '{"vehicleId":"<ID>","observations":"Revisao periodica"}'

# Itens, status e pagamento
curl -s -X POST http://localhost:3000/work-orders/$OS/items -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -d '{"serviceId":"<ID>","quantity":1}'
curl -s -X PATCH http://localhost:3000/work-orders/$OS/status -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"awaiting_approval","reason":"Orcamento"}'
curl -s -X PATCH http://localhost:3000/work-orders/$OS/status -H "Authorization: Bearer $STAFF_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"approved","reason":"Aprovado"}'
curl -s -X POST http://localhost:3000/work-orders/$OS/payment-confirmation \
  -H "Authorization: Bearer $STAFF_TOKEN" -H "Content-Type: application/json" \
  -d '{"note":"PIX recebido"}'

# Auditoria
curl -s http://localhost:3000/events/work_order/$OS -H "Authorization: Bearer $STAFF_TOKEN"
curl -s http://localhost:3000/events/stock/$STOCK_ID -H "Authorization: Bearer $STAFF_TOKEN"
```
