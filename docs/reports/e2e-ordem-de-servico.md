# Relatório E2E — Fluxo completo da Ordem de Serviço com reservas de estoque

> **Data da execução:** 23/10/2026 (22:54–23:04 UTC)
> **Ambiente:** Docker local (`backend` NestJS :3000, `postgres` 18-alpine, `adminer`), volume do Postgres **resetado do zero** antes da execução
> **Método:** validação **por requisições HTTP** na API (`http://localhost:3000`), com eventos validados em `GET /events/{entidade}/{id}` e estado do estoque em `GET /stock`
> **Escopo:** fluxo completo de duas OS cobrindo o modelo de reserva — `stock.reserved` no envio do orçamento (reserva direta na tabela `stocks`, sem movement), `stock.consumed` + movement **OUT** na aprovação e `stock.released` no cancelamento (sem movement).
> **Documentação de eventos:** [`docs/ddd/eventos-de-dominio.md`](../ddd/eventos-de-dominio.md)

---

## 1. Sumário do resultado

| Item | Valor |
|---|---|
| **OS A (fluxo feliz)** | `OS-0001/2026` — id `fc23458d-bca6-4fb7-8253-8cf4088aa899` — status final **`delivered`** ✅ |
| **OS B (cancelamento)** | `OS-0002/2026` — id `11fa9f37-618a-4a5e-a43c-4634998c8e3b` — status final **`cancelled`** ✅ |
| **OS C (teste negativo)** | `OS-0003/2026` — usada apenas para validar estoque insuficiente (409) |
| **Cliente** | `agnaldo.guimaraes` (seed) |
| **Veículo** | Chevrolet Onix 2020 Prata — placa `EBA1B26` (criado nesta execução, formato Mercosul) |
| **Aberta por** | `quiteria.dantas` (staff) |
| **Total OS A** | **R$ 648,00** (serviço R$ 450 + velas 4× R$ 32 + filtro de óleo 2× R$ 35) |
| **Total OS B** | **R$ 98,00** (filtro de ar do motor 2× R$ 49) |

## 2. Atores e preparação de ambiente

| Perfil | Usuário | Papel |
|---|---|---|
| Admin | `jose.silveira` | `admin` — reposição de estoque e cadastro do veículo |
| Staff | `quiteria.dantas` | `staff` — abertura da OS, itens, transições de status e pagamento |
| Cliente | `agnaldo.guimaraes` | `client` — aprovação do orçamento pela API |

- **Reset do banco:** `docker compose down -v && docker compose up -d` para partir de uma base limpa.
- **Migrations:** aplicadas automaticamente no boot do container fresh.
- **Seeds no boot:** 12 serviços (`RepairSeedService`), 18 produtos (`ProductSeedService`) e 9 tipos de evento (`EventTypeSeedService`).
- **Seed de usuários:** `npm run seed:container` dentro do container `backend` para popular `roles`, `clients`, `employees` e `users`.
- **E-mails:** `EMAIL_REDIRECT_TO` configurada no ambiente — o boot registrou o aviso do `ResendEmailSender` (todos os e-mails do ambiente vão para o destinatário configurado, sem expor o endereço aqui). Nenhum `ERROR` de notificação em toda a execução: os e-mails de orçamento (etapa 4) e conclusão (etapa 8) foram despachados em best-effort com sucesso.

## 3. Itens das OS

| Tipo | Item | SKU | Qtd | Unit (R$) | Subtotal (R$) |
|---|---|---|---:|---:|---:|
| Serviço (OS A) | Revisão completa | `a3f4ba9f…` | 1 | 450,00 | 450,00 |
| Produto (OS A) | Vela de ignição | `VELA-IGNICAO-01` | 4 | 32,00 | 128,00 |
| Produto (OS A) | Filtro de óleo | `FILTRO-OLEO-01` | 2 | 35,00 | 70,00 |
| Produto (OS B) | Filtro de ar do motor | `FILTRO-AR-01` | 2 | 49,00 | 98,00 |

Preparação de estoque (admin, `POST /stock/movements` tipo `IN`): +20 velas, +20 filtros de óleo, +10 filtros de ar. Estoque inicial de todos os produtos: 0.

## 4. Timeline do cenário A — fluxo feliz

### Etapa 0 — Preparação
- `POST /stock/movements` ×3 (`IN` 20 velas, 20 filtros de óleo e 10 filtros de ar) → **201**
- Estoque resultante: velas 20 (reserved 0) | filtro de óleo 20 (reserved 0) | filtro de ar 10 (reserved 0)
- Eventos: `stock.adjusted` com metadata `{productId, oldQuantity: 0, newQuantity, movementType: "IN", movementId}`

### Etapa 0.1 — Veículo do cliente
- `POST /vehicles/:user_id` (admin, `user_id` do cliente seed) → **201**, placa `EBA1B26` (Mercosul validada)
- Placas fora do padrão Mercosul/antigo (`E2E1A26`, sem letra na 4ª posição) → **400** (validação da entidade)
- Evento: `vehicle.created`

### Etapa 1 — Criação da OS
- `POST /work-orders` (staff) → **201**, status inicial `received`
- Evento: `work_order.created` com número `OS-0001/2026`

### Etapa 2 — Montagem do orçamento
- `POST /work-orders/:id/items` ×3 (staff) → **201** (total recalculado: 450 → 578 → 648; preço unitário congelado do catálogo)
- **Estoque: sem alteração nesta fase**
- Eventos: 3× `work_order.item_added` — itens de serviço (`serviceId`) e de produto (`productId`)

### Etapa 3 — Diagnóstico
- `PATCH /work-orders/:id/status` `{status:"under_diagnosis"}` → **200**
- Evento: `work_order.status_changed` `{from:"received", to:"under_diagnosis"}` (campos `reason` obrigatórios na transição; sem `reason` → **400**)
- Observação: transicionar direto `received → awaiting_approval` → **400** (máquina de estados respeitada)

### Etapa 4 — Envio do orçamento
- `PATCH /work-orders/:id/status` `{status:"awaiting_approval"}` → **200**
- **Estoque:** `reserved` manipulado diretamente na tabela `stocks` — velas 20 → **reserved 4** (available 16), filtro de óleo → **reserved 2** (available 18); `quantity` intacta
- **Sem movement** gerado para a reserva (o histórico de movimentações dos produtos segue apenas com os `IN` da reposição)
- Evento por produto: `stock.reserved` com metadata completa (exemplo, vela):

```json
{"productId":"1b264ef5…","quantity":4,"workOrderId":"fc23458d…","workOrderNumber":"OS-0001/2026",
 "reservedBefore":0,"reservedAfter":4,"availableBefore":20,"availableAfter":16}
```

- **E-mail** de orçamento disparado ao cliente (best-effort, sem falhas no log)

### Etapa 5 — Aprovação
- **Teste de papel:** o `client` dono da OS **aprova** com `PATCH /work-orders/:id/status` `{status:"approved"}` → **200** (autor do evento: `agnaldo.guimaraes`); o mesmo cliente tentando uma transição comum (`in_progress`) em OS já decidida → **403** `Cliente só pode aprovar ou recusar o orçamento da própria OS`
- **Estoque:** baixa física consolidada — velas 20 → **quantity 16** (reserved → 0), filtro de óleo → **quantity 18** (reserved → 0); `available` permanece igual (16/18), pois o físico consumido era justamente a parcela reservada
- **Movement `OUT`** criada em `stock_movements` por produto (histórico do catálogo):

```json
{"movementType":"OUT","quantity":2,"referenceType":"work_order","referenceId":"fc23458d…"}
```

- Evento por produto: `stock.consumed` com metadata completa (`reservedBefore/After`, `availableBefore/After`, `workOrderId`, `workOrderNumber`); autor `agnaldo.guimaraes` (quem aprovou)

### Etapa 6 — Confirmação de pagamento
- `PATCH /work-orders/:id/status` `{status:"in_progress"}` **sem pagamento** → **409** `Confirme o pagamento antes de iniciar o serviço` (trava validada)
- `POST /work-orders/:id/payment-confirmation` `{note:"PIX recebido em 23/10/2026"}` → **200** `{workOrderId, confirmed:true}`
- Evento: `work_order.payment_confirmed`

### Etapas 7–9 — Execução, conclusão e entrega
- `PATCH`: `in_progress` → **200** | `completed` → **200** | `delivered` → **200**
- Eventos: 3× `work_order.status_changed` (`in_progress → completed → delivered`)
- **E-mail** de conclusão disparado (best-effort, sem falhas no log)

### Timeline consolidada de eventos da OS A (cronológica, via `GET /events/work_order/:id`)

| # | Timestamp (UTC) | Evento | Autor |
|---|---|---|---|
| 1 | 2026-10-23T22:57:56.849Z | `work_order.created` | quiteria.dantas |
| 2–4 | 22:58:20.174–333 | 3× `work_order.item_added` | quiteria.dantas |
| 5 | 22:58:37.845Z | `work_order.status_changed` (received → under_diagnosis) | quiteria.dantas |
| 6 | 22:58:38.161Z | `work_order.status_changed` (under_diagnosis → awaiting_approval) | quiteria.dantas |
| 7 | 22:58:51.998Z | `work_order.status_changed` (awaiting_approval → approved) | agnaldo.guimaraes |
| 8 | 22:58:59.863Z | `work_order.payment_confirmed` | quiteria.dantas |
| 9 | 22:58:59.985Z | `work_order.status_changed` (approved → in_progress) | quiteria.dantas |
| 10 | 22:59:00.300Z | `work_order.status_changed` (in_progress → completed) | quiteria.dantas |
| 11 | 22:59:01.062Z | `work_order.status_changed` (completed → delivered) | quiteria.dantas |

Eventos associados ao **estoque** da vela (via `GET /events/stock/{stockId}`): `stock.adjusted` (reposição) + `stock.reserved` (etapa 4) + `stock.consumed` (etapa 5), todos com autor e metadata rastreáveis.

## 5. Timeline do cenário B — cancelamento

| Etapa | Ação | Resultado |
|---|---|---|
| 1 | `POST /work-orders` + item 2× filtro de ar (staff) | **201**; OS-0002/2026, total R$ 98 |
| 2 | `PATCH` `under_diagnosis` → `awaiting_approval` | **200**; estoque: **reserved 2**, quantity 10, available 8 |
| 3 | `PATCH` `cancelled` (staff) | **200**; estoque: **reserved → 0**, quantity 10 intacta, **available de volta a 10** |
| 4 | `GET /stock/movements` do produto | apenas **1 movement `IN`** (reposição) — **nenhuma movement gerada pela reserva/liberação** |

Eventos de estoque do filtro de ar (ordem cronológica, via `GET /events/stock/:id`):

```json
{"eventTypeCode":"stock.adjusted","metadata":{"newQuantity":10,"movementType":"IN"}}
{"eventTypeCode":"stock.reserved","metadata":{"quantity":2,"workOrderId":"11fa9f37…","reservedBefore":0,"reservedAfter":2,"availableBefore":10,"availableAfter":8}}
{"eventTypeCode":"stock.released","metadata":{"quantity":2,"workOrderId":"11fa9f37…","reservedBefore":2,"reservedAfter":0,"availableBefore":8,"availableAfter":10}}
```

## 6. Testes negativos validados

1. **Estoque insuficiente no orçamento** (`OS-0003/2026`): adicionar 20 velas com disponível 16 → **409** `Estoque insuficiente…: disponível 16, solicitado 20` (e 15 unidades passam, validando o limite exato).
2. **Cliente fora do escopo**: cliente tentou transicionar OS já aprovada (`in_progress`) → **403** `Cliente só pode aprovar ou recusar o orçamento da própria OS`.
3. **Trava de pagamento**: `approved → in_progress` sem pagamento confirmado → **409** `Confirme o pagamento antes de iniciar o serviço`.
4. **Transição ilegal**: `received → awaiting_approval` sem diagnóstico → **400** `Não é permitido alterar a OS de received para awaiting_approval`.
5. **`reason` obrigatório** nas transições de status → **400** quando ausente.

## 7. Estado final do estoque

| Produto | quantity | reserved | available | Movements totais |
|---|---:|---:|---:|---|
| Vela de ignição | 16 | 0 | 16 | 1× IN(20), 1× OUT(4) |
| Filtro de óleo | 18 | 0 | 18 | 1× IN(20), 1× OUT(2) |
| Filtro de ar do motor | 10 | 0 | 10 | 1× IN(10) |

## 8. Regras de negócio validadas nesta execução

1. **Reserva direta na tabela** — `awaiting_approval` apenas incrementa `stocks.reserved` (não gera `stock_movements`); o disponível se reduz por `quantity - reserved`.
2. **Único movement gerado pelo fluxo de OS é `OUT`** — gravado só na aprovação (consumo físico consolidado), com `referenceType="work_order"` e `referenceId` da OS.
3. **Eventos de estoque enriquecidos** — `stock.reserved`, `stock.consumed` e `stock.released` gravados com `workOrderId`, `workOrderNumber`, `reservedBefore/After` e `availableBefore/After`; autor rastreável.
4. **Cancelamento devolve o saldo** — `cancelled` em `awaiting_approval` restaura `available` sem alterar `quantity` e sem movement.
5. **Preço congelado** — `unitPrice` capturado do catálogo na adição do item.
6. **Travas de papel e pagamento** — conforme seção 6.
7. **Máquina de estados e validações de entrada** — transição ilegal e `reason` ausente rejeitados.
8. **Auditoria completa** — 11 eventos de OS no cenário A + eventos de estoque nos três cenários, todos com timestamp, autor e metadata.

## 9. Requisições de referência (reexecução)

A execução foi feita por requisições HTTP contra a API local (`http://localhost:3000`), sempre com `Authorization: Bearer <token>` obtido no login (`POST /auth/login` com `login` e `password` dos usuários seed). Sequência do cenário feliz:

| # | Método | Endpoint | Corpo |
|---|---|---|---|
| 1 | `POST` | `/auth/login` | `{login, password}` — repetido para admin, staff e client |
| 2 | `POST` | `/stock/movements` | `{productId, quantity, movementType: "IN", description}` — reposição |
| 3 | `POST` | `/vehicles/:user_id` | `{license_plate, brand, model, year, color}` |
| 4 | `POST` | `/work-orders` | `{vehicleId, observations}` |
| 5 | `POST` | `/work-orders/:id/items` | `{serviceId, quantity}` ou `{productId, quantity}` |
| 6 | `PATCH` | `/work-orders/:id/status` | `{status, reason}` — `under_diagnosis`, `awaiting_approval`, `approved`, `in_progress`, `completed`, `delivered` |
| 7 | `POST` | `/work-orders/:id/payment-confirmation` | `{note}` |
| 8 | `GET` | `/events/work_order/:id` | — (auditoria) |
| 9 | `GET` | `/events/stock/:id` | — (auditoria) |
| 10 | `GET` | `/stock` e `/stock/movements` | — (estado final) |
