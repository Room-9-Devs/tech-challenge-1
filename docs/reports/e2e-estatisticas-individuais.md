# Relatório — Estatísticas Individuais da OS (`GET /work-orders/:id/stats`)

**Data:** 23/10/2026 · **Feature:** comparativo entre o ciclo de vida da OS e as estatísticas globais da oficina

Complemento do [`e2e-estatisticas.md`](e2e-estatisticas.md) (estatísticas globais). Este relatório documenta o endpoint de estatísticas individuais por ordem de serviço, validado **por requisições HTTP** contra a stack real (Docker local).

---

## 1. Escopo

Estatísticas do ciclo de vida de **uma OS específica**, comparadas lado a lado com as médias globais da oficina (mesmo cálculo de `GET /stats?period=all`):

- **6 etapas** do fluxo (recebida → diagnóstico → orçamento → aprovação → execução → conclusão → entrega), cada etapa com duração fechada, duração em curso (etapa aberta) e a média global correspondente;
- **total** (criação → conclusão ou em curso), comparado com `avg_time_from_received`;
- **status atual** e tempo de permanência nele.

## 2. Implementação (padrão do projeto)

| Peça | Arquivo |
|---|---|
| Port | `application/ports/work-order-stats.repository.ts` — `findRecordById(id)` |
| Infra | `typeorm-work-order-stats.repository.ts` — implementação (OS por id + eventos `work_order.status_changed` cronológicos) |
| Stats | `application/use-cases/work-order-stats/get-work-order-stats-detail/` — `stages.ts` (etapas declarativas `WORK_ORDER_STAGES` + builders puros), use case, DTOs |
| HTTP | `work-orders.controller.ts` — `GET /work-orders/:id/stats` → provider em `app.module.ts` |

- **Autorização** (padrão de `FindWorkOrderUseCase`): `admin` e `staff` consultam qualquer OS; `client` somente as próprias (`403` caso contrário); OS inexistente → `404`.
- **Comparativo global fixo** (`period=all`), reusando `GetWorkOrderStatsUseCase`.
- A etapa **entrega** não tem média global correspondente (o registry global não registra esse par) — retorna `global: null`.
- As 17 estatísticas globais e o endpoint `GET /stats` (só admin) permanecem inalterados.

## 3. Validação por requisições HTTP

Stack local (Docker): `backend` :3000, `postgres` :5432. Fluxo executado com requisições HTTP (login → OS → item → transições → pagamento → entregue → consultas), conforme a seção 9 de [`e2e-ordem-de-servico.md`](e2e-ordem-de-servico.md).

### 3.1 OS com diferentes estágios (base da sessão)

| OS | Status | Resultado do endpoint | Confere com os eventos |
|---|---|---|---|
| OS-0001/2026 | delivered | 6 etapas fechadas, todas `0d 0h 0m` (transições a segundos); total fechado **`0d 0h 1m`**; status atual `delivered` | fluxo completo executado na sessão ✓ |
| OS-0005/2026 | awaiting_approval | etapas fechadas `0d 0h 0m`; etapa `approved` **em curso** com `pendingDuration = 0d 0h 1m`; total **pendente**; etapas posteriores não iniciadas (`null`) | criada → diagnóstico → orçamento enviado; decisão pendente do cliente ✓ |
| OS-0002/2026 | cancelled | etapas fechadas até a decisão (`0d 0h 0m`), demais **sem duração e sem pendências** | status terminal → nada em curso ✓ |

### 3.2 Comparativo com as médias globais

Toda etapa retorna `global` com o valor idêntico ao `GET /stats?period=all` da mesma base (executada em uma única janela: `0d 0h 0m`), como no exemplo abaixo. Em base com histórico (execuções anteriores com eventos retroativos), os comparativos globais acompanharam as médias globais.

### 3.3 Resposta de referência (amostra real, OS-0005/2026)

```json
{
  "number": "OS-0005/2026",
  "status": "awaiting_approval",
  "stages": [
    { "tag": "under_diagnosis",   "duration": "0d 0h 0m",
      "global": { "tag": "avg_time_from_received_to_under_diagnosis", "value": "0d 0h 0m" } },
    { "tag": "awaiting_approval", "duration": "0d 0h 0m",
      "global": { "tag": "avg_time_from_under_diagnosis_to_awaiting_approval", "value": "0d 0h 0m" } },
    { "tag": "approved", "duration": null, "pendingDuration": "0d 0h 1m",
      "global": { "tag": "avg_time_from_awaiting_approval_to_approved", "value": "0d 0h 0m" } }
  ],
  "total": { "duration": null, "pendingDuration": "0d 0h 2m",
             "global": { "tag": "avg_time_from_received", "value": "0d 0h 0m" } },
  "currentStatus": { "status": "awaiting_approval", "duration": "0d 0h 2m" }
}
```

### 3.4 Autorização e erros (via requisições HTTP)

| Caso | Esperado | Obtido |
|---|---|---|
| Sem token | 401 | **401** ✓ |
| OS inexistente (admin) | 404 | **404** ✓ (`Ordem de serviço … não encontrada`) |
| Id fora do formato UUID | 400 | **400** ✓ (`O ID informado não é um UUID válido`) |
| Cliente não dono da OS | 403 | **403** ✓ (`Você não tem acesso a esta ordem de serviço`) |
| Cliente dono | 200 | **200** ✓ |
| Staff | 200 | **200** ✓ |

## 4. Observações operacionais

1. **E-mails:** as transições de `awaiting_approval`/`completed` dispararam notificações reais via Resend, redirecionadas conforme `EMAIL_REDIRECT_TO` configurada no ambiente (best-effort; nenhum `ERROR` no log).
2. **Média "em curso" para etapa corrente:** a OS aguardando decisão do cliente mostra `approved` com `pendingDuration` — intencional (etapa aberta entre envio do orçamento e decisão).
3. **`JWT_SECRET`:** variável prescrita em `.env.example`; sem ela o boot exige a variável definida em `backend/.env`.

## 5. Veredito

**Aprovado.** O endpoint individual reproduz corretamente as durações da própria OS a partir dos eventos persistidos (auditoria cruzada com `GET /events/work_order/:id`), expõe o comparativo com as médias globais e aplica a autorização do módulo de OS (dono, staff/admin e casos de erro 400/404). Nenhuma alteração nas estatísticas globais existentes.
