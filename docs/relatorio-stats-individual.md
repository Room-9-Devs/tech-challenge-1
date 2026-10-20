# Relatório — Estatísticas Individuais da OS (`GET /work-orders/:id/stats`)

**Data:** 17/10/2026 · **Branch:** `feat/stats` · **Feature:** comparativo OS × estatística global da oficina

Complemento do [`relatorio-e2e-estatisticas.md`](./relatorio-e2e-estatisticas.md) (estatísticas globais). Este relatório documenta a segunda parte: o endpoint de estatísticas individuais por ordem de serviço e a validação, realizada **exclusivamente por rotas HTTP** (sem scripts automatizados).

---

## 1. Escopo

Estatísticas do ciclo de vida de **uma OS específica**, comparadas lado a lado com as
médias globais da oficina (mesmo cálculo de `GET /stats?period=all`):

- **6 etapas** do fluxo (recebido → diagnóstico → orçamento → aprovação → execução
  → conclusão → entrega), cada etapa com duração fechada, duração em curso
  (etapa aberta) e a média global correspondente;
- **total** (criação → conclusão ou em curso), comparado com `avg_time_from_received`;
- **status atual** e tempo de permanência nele.

## 2. Implementação (padrão do projeto)

| Peça | Arquivo |
|---|---|
| Port | `application/ports/work-order-stats.repository.ts` — novo `findRecordById(id)` |
| Infra | `typeorm-work-order-stats.repository.ts` — implementação (OS por id + eventos `work_order.status_changed` cronológicos) |
| Stats | `application/use-cases/work-order-stats/get-work-order-stats-detail/` — `stages.ts` (etapas declarativas `WORK_ORDER_STAGES` + builders puros), use case, DTOs |
| HTTP | `work-orders.controller.ts` — `GET /work-orders/:id/stats` → provider em `app.module.ts` |

- **Autorização** (padrão de `FindWorkOrderUseCase`): `admin` e `staff` consultam
  qualquer OS; `client` somente as próprias (`403` caso contrário); OS inexistente → `404`.
- **Comparativo global fixo** (`period=all`), reusando `GetWorkOrderStatsUseCase`.
- A etapa **entrega** não tem média global correspondente (o registry global não
  registra esse par) — retorna `global: null`.
- As 17 estatísticas globais e o endpoint `GET /stats` permanecem inalterados.

## 3. Testes unitários

Suítes novas em `test/unit/application/use-cases/work-order-stats/`:

- `stages.spec.ts` — builders puros: etapas fechadas, em curso, não alcançadas;
  OS cancelada (sem pendências); total fechado/pendente; status atual; fallback
  de global ausente — **12 testes**;
- `get-work-order-stats-detail.use-case.spec.ts` — dono ok, cliente de outra OS
  (403), OS inexistente (404), mapeamento das médias globais — **7 testes**.

Estado do projeto após a feature:

| Suite | Resultado |
|---|---|
| `work-order-stats` (todas) | **77/77 ✓** |
| `npm test` inteiro | **698 ✓**, 5 skip; 2 falhas **pré-existentes no HEAD** (`create-product.use-case.spec`, `work-order-transaction.helpers.spec` — drift de assinaturas de outra feature, confirmadas via `git stash`) |
| `npx eslint src test` | limpo nas alterações; 6 erros pré-existentes (outras partes) |

## 4. Validação por rotas HTTP (manual)

Stack local (docker): `backend` `:3000`, `postgres` `:5432`. Fluxo executado com
`curl` apenas: login → OS → item → transições → pagamento → entregue → consultas.

### 4.1 OS com eventos históricos (intervals de dias, cenário anterior)

| OS | Status | Resultado do endpoint (obtido) | Confere com eventos do banco |
|---|---|---|---|
| OS-0010/2026 | completed | etapas fechadas: **5d / 15d / 20d / 10d / 7d**; entrega **pendente 2d 21h**; total **57d 0h 0m** | criada -60d; ud -55d; orçamento -40d; aprovado -20d; execução -10d; concluída -3d ✓ |
| OS-0011/2026 | awaiting_approval | fechadas: **5d / 24d**; "aguardando aprovação" **pendente 0d 21h**; total **pendente 29d 21h** | criada -30d; ud -25d; orçamento -1d ✓ |
| OS-0012/2026 | received | etapa 1 **pendente 0d 21h**, demais não iniciadas | sem transições ✓ |
| OS-0002/2026 | cancelled | fechadas até a recusa (0d 0h 0m), demais sem duração **e sem pendências** | terminal → nada em curso ✓ |
| OS-0001/2026 | delivered | todas fechadas (0d 0h 0m — tempo real) | fluxo real ✓ |

Comparativo de globais nas respostas: valores idênticos ao `GET /stats?period=all`
auditado (ex.: `avg_time_from_received = 56d 19h 12m` na base de 13 OS).

### 4.2 OS novo criada 100% por rotas (tempo real)

`OS-0014/2026`: veículo novo (`HTS-4471`, `POST /vehicles/:userId`) → OS → item de
serviço → ciclo completo (`PATCH /status` + `POST /payment-confirmation`) → `delivered`.

- Todas as etapas `0d 0h 0m` (transições a segundos; `formatDuration` trunca em
  minutos) — **comportamento esperado para fluxo só-HTTP**;
- Globais atualizaram em cascata: `wo_started` 13→**14**, `wo_completed` 5→**6**,
  `wo_delivered` 3→**4**, `avg_time_from_received` 56d 19h 12m → **47d 8h 0m**,
  `avg_time_from_received_to_under_diagnosis` 7d → **6d 8h 43m** ✓.

### 4.3 Autorização e erros (via rotas)

| Caso | Esperado | Obtido |
|---|---|---|
| Sem token | 401 | **401** ✓ |
| OS inexistente (admin) | 404 | **404** ✓ |
| Id fora do formato UUID | 400 | **400** ✓ |
| Cliente não dono da OS | 403 | **403** ✓ (`Você não tem acesso a esta ordem de serviço`) |
| Cliente dono | 200 | **200** ✓ |
| Staff | 200 | **200** ✓ |

## 5. Respostas (amostras reais)

`OS-0011/2026` (aguardando aprovação, etapas com dias):

```json
{
  "number": "OS-0011/2026",
  "status": "awaiting_approval",
  "stages": [
    { "tag": "under_diagnosis",   "duration": "5d 0h 0m",
      "global": { "tag": "avg_time_from_received_to_under_diagnosis", "value": "7d 0h 0m" } },
    { "tag": "awaiting_approval", "duration": "24d 0h 0m",
      "global": { "tag": "avg_time_from_under_diagnosis_to_awaiting_approval", "value": "10d 19h 12m" } },
    { "tag": "approved", "duration": null, "pendingDuration": "0d 21h 48m",
      "global": { "tag": "avg_time_from_awaiting_approval_to_approved", "value": "14d 0h 0m" } }
  ],
  "total": { "duration": null, "pendingDuration": "29d 21h 48m",
             "global": { "tag": "avg_time_from_received", "value": "56d 19h 12m" } },
  "currentStatus": { "status": "awaiting_approval", "duration": "0d 21h 48m" }
}
```

## 6. Observações operacionais

1. **`JWT_SECRET`:** o `.env` local não possuía a variável que o boot exige
   (prescrita em `.env.example`). Adicionado valor aleatório de dev em
   `backend/.env` e o container `backend` foi recriado (`docker compose up -d
   --force-recreate backend`). Tokens anteriores ficam inválidos (re-login é
   automático nos testes).
2. **E-mails:** as transições de `awaiting_approval`/`completed` da OS-0014
   dispararam notificações reais via Resend, redirecionadas para o
   `EMAIL_REDIRECT_TO` configurado.
3. **Média "em curso" para etapa corrente:** a OS aguardando decisão do cliente
   mostra `approved` com `pendingDuration` — intencional (etapa aberta entre
   envio do orçamento e decisão).
4. Falhas de suite pré-existentes (fora deste escopo): `create-product`,
   `work-order-transaction.helpers` — drift de assinaturas de features
   anteriores; manualmente confirmadas no HEAD limpo.

## 7. Veredito

**Aprovado.** O endpoint individual reproduz corretamente as durações da própria
OS a partir dos eventos persistidos (auditoria cruzada com `psql` sobre a base),
expõe o comparativo com as médias globais e aplica a autorização do módulo de
OS. Contadores e médias globais reagiram corretamente à inserção de uma nova
OS por rotas puras. Nenhuma alteração nas estatísticas globais existentes.
