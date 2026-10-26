# Relatório de Integração — Fluxos principais da Ordem de Serviço (banco real)

> **Data da execução:** 22/10/2026
> **Branch:** `test/integration-work-order-flows` (2 commits à frente da `develop`: testes + relatório)
> **Ambiente:** Windows 11, Node.js v24.13.0, Jest 29.7 (`ts-jest`), PostgreSQL `postgres:18-alpine` em Docker (`localhost:5433`, database isolado `app_test`)
> **Método:** use cases reais (sem HTTP, sem Nest TestingModule, sem Resend/FIPE/seeds) instanciados contra um schema Postgres temporário `regression_*` com **todas as 17 migrations** aplicadas; toda verificação de estado é feita **relerindo o banco por SQL** (`database.query`), provando commit e rollback reais.
> **Especificação:** `docs/plano-testes-integracao.md` (testes do fluxo de trabalho — OS, orçamento, estoque e isolamento entre clientes)

---

## 1. Sumário do resultado

| Suíte | Testes | Falhas | Tempo |
|---|---|---|---|
| `backend/test/integration/work-order-flows.spec.ts` | **7 ✓** | **0** | ~10s |
| `backend/test/integration/vehicle-persistence.spec.ts` (regressão de usuário/veículo) | **5 ✓** | **0** | ~11s |
| **Total integração** | **12 ✓** | **0** | ~15s |

- **Opt-in verificado:** sem `RUN_DATABASE_INTEGRATION_TESTS=true`, as 2 suítes são marcadas como *skipped* e o Jest sai 0 — nenhuma conexão é aberta.
- **Não deixou rastro:** nenhum schema `regression_*` permanece em `app_test` (conferido por `information_schema.schemata` ao final).
- **Fix incluído neste commit:** `vehicle-persistence.spec.ts` passou a incluir as migrations `CreateEventsAndEventTypes1791499396508` e `UsersSoftDelete1792190000000`, necessárias porque o `TypeOrmUserRepository` hoje conta com a coluna de soft-delete `deleted_at` (sem isso, 2 dos 5 testes já falhavam na `develop`).

## 2. Testes executados

| Teste | O que comprova | Resultado |
|---|---|---|
| `percorre a OS de received até delivered e baixa o estoque na aprovação` | Ciclo completo em 9 passos: cliente da OS é o dono do veículo (`client_id`), `created_by` é o staff, número `OS-0001/2026`, total `0 → 150 → 230`; reserva em `awaiting_approval` (`stocks`: 5/2, evento `stock.reserved`, **0** movements); aprovação do cliente baixa o estoque (5 → **3**, reservado 0) com movement **OUT** (qtd 2, saldo anterior 5, `reference_type = work_order`), evento `stock.consumed` e **não** `stock.released`; iniciar sem pagamento falha com `Confirme o pagamento antes de iniciar o serviço` e status permanece `approved`; após confirmação, `in_progress → completed → delivered` sem mexer no estoque. | ✅ (606 ms) |
| `recusa do client libera a reserva e não baixa o estoque` | Cancelamento pelo cliente em `awaiting_approval`: estoque volta a 5/0, **zero** movements (nada consumido), evento `stock.released` gravado e `stock.consumed` inexistente. | ✅ (302 ms) |
| `não grava item quando a quantidade passa do disponível` | Item de 6 unidades com estoque 5 rejeita com `InsufficientStockError` e **nada vaza**: 0 itens gravados, OS em `received`, estoque intacto 5/0 (rollback). | ✅ (135 ms) |
| `a segunda reserva falha e não grava awaiting_approval` | Concorrência: duas OS incluem 3 unidades do mesmo produto (incluir não reserva), a OS A reserva no envio; o envio da OS B rejeita (`InsufficientStockError`) **dentro da transação** que gravaria o status — rollback completo: B fica em `under_diagnosis`, A permanece `awaiting_approval`, estoque 5/3, 0 movements da B e exatamente **1** evento `stock.reserved`. | ✅ (324 ms) |
| `trava os itens depois do envio do orçamento` | Novo item após `awaiting_approval` rejeita com `Os itens só podem ser alterados antes do envio do orçamento`; a OS mantém exatamente **1** item e reserva 0 (item de serviço). | ✅ (224 ms) |
| `recusa a transição ilegal de received para completed` | Pular etapas rejeita com `InvalidWorkOrderError` (`Não é permitido alterar a OS de received para completed`); status relido permanece `received`. *Obs.: o plano original pedia `received → in_progress`, mas o gate de pagamento de `in_progress` roda antes do mapa de transições e lança `WorkOrderConflictError` (já coberto no passo 7 do fluxo feliz); a intenção do teste — transição ilegal interrompida com `InvalidWorkOrderError` e status intacto — é preservada.* | ✅ (142 ms) |
| `cliente não vê OS de outro cliente` | Isolamento por cliente: a listagem do cliente retorna **apenas** a própria OS (`result.data` paginado); `findWorkOrder` na OS alheia lança `WorkOrderAccessDeniedError`; na própria, resolve com `clientId` correto. | ✅ (200 ms) |

## 3. Como o teste trabalha (harness)

| Item | Detalhe |
|---|---|
| Schema isolado | `regression_<uuid>` criado uma vez por execução (`beforeAll`), migrations aplicadas nele; limpeza de dados por `TRUNCATE ... RESTART IDENTITY CASCADE` entre testes (`beforeEach`), preservando `event_types`; drop do schema no `afterAll`, guardado por regex |
| Enums em `public` | `products_product_type_enum`, `products_unit_enum` e `stock_movements_movement_type_enum` são recriados por migrations em `public` e dropados no início da execução (somente no banco de teste, garantido pelo guard) |
| Guard de segurança | Só executa contra Postgres, database `app_test`, host `localhost`/`127.0.0.1`, porta `5433` — caso contrário falha antes de escrever qualquer coisa |
| Tipos de evento | A migration já insere `stock.reserved`/`stock.released`; o cenário insere com `ON CONFLICT DO NOTHING` os demais (`stock.consumed`, `work_order.created/status_changed/payment_confirmed/item_added`) |
| Eventos pós-commit | Publisher de teste grava os eventos de OS publicados pelos use cases via `EventRecorderService` real; eventos de estoque são os gravados pelo próprio `TypeOrmWorkOrderUnitOfWork` |
| Responsável pelo estado | Nenhum mock de persistência: repositórios e unit of work TypeORM reais sobre o schema de teste (`synchronize: false`) |

## 4. Como reproduzir

```bash
docker run --name app-test -d -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=app_test -p 5433:5432 postgres:18-alpine
```

```powershell
cd backend
$env:RUN_DATABASE_INTEGRATION_TESTS = 'true'
$env:DATABASE_HOST = 'localhost'
$env:DATABASE_PORT = '5433'
$env:DATABASE_USER = 'postgres'
$env:DATABASE_PASSWORD = 'password123'
$env:DATABASE_NAME = 'app_test'
npm run test:integration -- --runInBand
```

## 5. Veredito

**Aprovado.** Os 7 testes dos fluxos principais — mais a regressão de usuário/veículo — passam contra PostgreSQL real, provando por SQL: ciclo de vida completo da OS com auditoria de eventos, baixa e liberação de estoque na decisão do cliente, rollback de inclusão e de reserva em concorrência, pagamento obrigatório antes da execução, regras de transição/travamento de itens e isolamento entre clientes. Sem a base de teste apropriada, a suíte é pulada sem efeito.
