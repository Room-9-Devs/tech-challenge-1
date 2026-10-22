# Relatório E2E — Estatísticas de Ordens de Serviço (`GET /stats`)

**Data:** 17/10/2026 · **Branch:** `feat/stats` · **Commit revisado:** `1b137b7` ("Estabelecidas as estatísticas")

---

## 1. Escopo

1. Revisão do último commit da branch `feat/stats`;
2. Validação funcional do endpoint `GET /stats` via testes E2E contra a stack real
   (backend NestJS em `:3000`, PostgreSQL Docker em `:5432`), criando ordens de
   serviço manualmente pela API e reposicionando os timestamps dos eventos no
   banco para gerar **intervalos de dias** entre transições — necessário para
   exercitar as médias temporais;
3. Entrega dos resultados neste documento.

## 2. Revisão do commit `1b137b7`

O commit completa o endpoint `GET /stats` com a camada de cálculo das
estatísticas (o endpoint e a resolução de período haviam sido criados em
`c859b04`).

**Arquitetura** (Clean Architecture, bem aplicada):

| Camada | Peça |
|---|---|
| Port | `WorkOrderStatsRepository.findRecordsCreatedUntil()` — cada OS com `createdAt` + transições cronológicas |
| Use case | `GetWorkOrderStatsUseCase` — valida input, resolve período, delega cálculo ao registry |
| Framework de stats | `WorkOrderStat` (tag/name/hint/compute) + helpers `statusAt`, `firstEnteredAt`, `isInPeriod` |
| Registry | `WORK_ORDER_STATS` com **17 estatísticas**: 2 contadores, 6 snapshots de status, 9 médias de duração |
| Infra | `TypeOrmWorkOrderStatsRepository` reconstrói o estado das OS a partir dos eventos `work_order.status_changed` (`metadata->>'to'`) |
| Testes unitários | 371 linhas (`stats.spec.ts`) + spec do use case — **59 testes, 100% passando** |

**Pontos fortes:** registry extensível (incluir/remover stat não exige remodelar
nada); cálculo é puro e testável de forma isolada; leitura única do banco
(2 queries) sem N+1; semântica documentada nos `hint` de cada stat.

**Achados da revisão** (detalhados na seção 6):

1. Inconsistência: `avg_time_from_*` (conclusão) retorna `"0d 0h 0m"` quando não
   há dados, enquanto as médias entre transições retornam `"sem dados"`;
2. Snapshots de status contam **todas** as OS criadas até o fim do período, mesmo
   as criadas antes do início da janela — semântica correta ("estado ao fim do
   período"), mas sensível ao histórico da base;
3. `firstEnteredAt` usa a primeira transição ao status — seguro porque a máquina
   de estados é acíclica;
4. Repositório carrega todas as OS/eventos em memória — aceitável na escala do
   projeto.

## 3. Ambiente e método

- Containers do `docker-compose.yml`: `backend` (NestJS, fuso UTC), `postgres`
  18 (db `app`), `adminer` — todos no ar;
- Seeds aplicados: usuários `jose.silveira` (admin), `quiteria.dantas` (staff),
  `agnaldo.guimaraes` (client); 3 OS pré-existentes no baseline;
- Script E2E: `backend/test/e2e/work-order-stats.e2e.ts` (ts-node, fora do
  jest) + helpers de cálculo em `backend/test/e2e/lib-stats.ts`;
- **Estratégia:** os valores esperados são calculados por um *espelho
  independente* da semância das 17 stats e do `resolveStatsPeriod`, sobre o
  estado bruto reconstruído do banco (baseline + cenário). A comparação API ×
  espelho cobre 5 janelas diferentes.

## 4. Cenário E2E (via API real)

5 OS criadas com `POST /work-orders`, itens de serviço, fluxo completo
(`PATCH /status` + confirmação de pagamento) e, em seguida, backdate via SQL de
`work_orders.created_at` e `events.created_at`:

| OS | Criada | Fluxo (instantes relativos) | Status final |
|---|---|---|---|
| A | -90d | diagnóstico -70d → orçamento -60d → aprovação -45d → execução -30d (pagamento confirmado) → conclusão -5d | `delivered` (-2d) |
| B | -60d | diagnóstico -55d → orçamento -40d → aprovação -20d → execução -10d → **concluída** -3d | `completed` |
| C | -30d | diagnóstico -25d → orçamento -1d | `awaiting_approval` |
| D | -15d | sem transições | `received` |
| E | -45d | diagnóstico -40d → orçamento -35d → cancelada -30d | `cancelled` |

Nenhum dado foi apagado; o baseline pré-existente (3 OS) entra no cálculo
esperado. Efeitos colaterais: 1 veículo novo associado ao cliente seeded e
e-mails de notificação redirecionados para o destinatário configurado em
`EMAIL_REDIRECT_TO`.

## 5. Resultados (rodada final: 105 checks, 0 falhas)

### 5.1 `?period=custom&start_date=<hoje-100d>&end_date=<hoje>`

| Estatística | Esperado | Obtido | ✓ |
|---|---|---|---|
| `wo_started` | `13` | `13` | ✓ |
| `wo_completed` | `5` | `5` | ✓ |
| `wo_delivered` | `3` | `3` | ✓ |
| `wo_cancelled` | `3` | `3` | ✓ |
| `wo_approved` / `wo_under_diagnosis` / `wo_in_progress` | `0` | `0` | ✓ |
| `wo_awaiting_approval` | `2` | `2` | ✓ |
| `avg_time_from_received_to_under_diagnosis` | `7d 0h 0m` | `7d 0h 0m` | ✓ |
| `avg_time_from_under_diagnosis_to_awaiting_approval` | `10d 19h 12m` | `10d 19h 12m` | ✓ |
| `avg_time_from_awaiting_approval_to_approved` | `14d 0h 0m` | `14d 0h 0m` | ✓ |
| `avg_time_from_approved_to_in_progress` | `10d 0h 0m` | `10d 0h 0m` | ✓ |
| `avg_time_from_in_progress_to_completed` | `12d 19h 12m` | `12d 19h 12m` | ✓ |
| `avg_time_from_received` | `56d 19h 12m` | `56d 19h 12m` | ✓ |
| `avg_time_from_diagnosis` | `46d 19h 12m` | `46d 19h 12m` | ✓ |
| `avg_time_from_awaiting_approval` | `36d 19h 12m` | `36d 19h 12m` | ✓ |
| `avg_time_from_approved` | `22d 19h 12m` | `22d 19h 12m` | ✓ |

As médias refletem exatamente os intervalos de dias injetados (ex.: auditoria
manual de `received→diagnóstico`: (20+5+5+5)d × 2 lotes ÷ 10 OS = 7d ✓).

### 5.2 Janelas menores (filtragem temporal)

| Janela | Diferenças relevantes vs. `custom 100d` |
|---|---|
| `period=week` (7d) | `wo_started=3` (só baseline de ontem; cenário tem >7d), `received→diagnóstico=0d 0h 0m`, `awaiting→approved=0d 0h 0m`, `diag→awaiting=12d` (só transições dentro da janela) |
| `period=month` (30d) | `wo_started=7`, `received→diagnóstico=2d 12h`, `awaiting→approved=13d 8h` — só parte do cenário entra |
| `period=all` | igual à janela custom (baseline + cenário completos) |

Todas as 17 stats × 3 janelas coincidiram com o esperado.

### 5.3 Snapshot em dia passado (`custom` com fim em hoje-65d)

Valida a semântica de "estado ao fim do período":

| Estatística | Esperado | Obtido |
|---|---|---|
| `wo_started` | `2` (só OS criadas até o dia) | `2` ✓ |
| `wo_under_diagnosis` | `2` (estavam em diagnóstico naquele dia) | `2` ✓ |
| `wo_delivered` / demais snapshots | `0` | `0` ✓ |
| `avg_time_from_received_to_under_diagnosis` | `20d 0h 0m` | `20d 0h 0m` ✓ |
| médias entre transições posteriores | `sem dados` | `sem dados` ✓ |
| médias de conclusão (sem conclusões na janela) | `0d 0h 0m` | `0d 0h 0m` ✓ |

### 5.4 Validação e autorização

| Caso | Resultado |
|---|---|
| Sem token | `401` ✓ |
| Staff (não admin) | `403` ✓ |
| Client (não admin) | `403` ✓ |
| `period=bogus` | `400` ✓ |
| `start_date=2026-02-30` (data inexistente) | `400` ✓ |
| `start_date > end_date` | `400` ✓ |
| `period=custom` sem datas | resolve como `all` ✓ |
| `end_date` sem `start_date` | `period=custom`, início = hoje ✓ |

## 6. Achados e observações

1. **Inconsistência de "sem dados"** (`avg-completion-time.stat.ts:42` retorna
   `formatDuration(0)`): quando não há OS concluídas na janela, as 4 médias de
   conclusão exibem `0d 0h 0m` enquanto as médias entre transições exibem
   `sem dados`. Sugestão de unificação para `sem dados` — não alterado, por ser
   decisão de produto/frontend.
2. **Snapshots globais:** com a base carregada de histórico, os snapshots
   (`wo_delivered`, etc.) contam OS anteriores ao início da janela. É a
   semântica documentada no `hint`, mas merece destaque no frontend.
3. **Falhas de suite pré-existentes** (não relacionadas a este commit nem às
   alterações): `create-product.use-case.spec.ts` e `composition.spec.ts`
   (construtores de fake/UoW divergem do use case — TS2554, 3 vs 4 args) e
   `vehicle-persistence.spec.ts` (`CreateUserUseCase` TS2554, 5 vs 4 args).
   Tudo o mais: **612 testes passarão** quando essas assinaturas forem
   atualizadas.
4. **E-mails:** as transições para `awaiting_approval`/`completed` dispararam
   notificações reais via Resend, redirecionadas conforme `EMAIL_REDIRECT_TO`
   (best-effort; nenhuma falha da fila de e-mail afetou os resultados).

## 7. Veredito

**Aprovado.** O funcionamento do `GET /stats` após a inclusão de ordens de
serviço com eventos espaçados por dias correspondeu à semântica documentada em
todas as janelas testadas, incluindo snapshooting em data passada, filtragem
temporal e validação de entrada. Nenhum bug encontrado no código do commit;
único ponto de melhoria é a unificação de `sem dados` vs `0d 0h 0m`.

## 8. Reprodução

```bash
# a partir de backend/ com a stack no ar (docker compose up)
npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' \
  test/e2e/work-order-stats.e2e.ts
# resumo: backend/test/e2e/last-run.json (105 checks, 0 falhas)
```

*Nota: o script é idempotente no sentido de sempre criar um cenário novo — cada
execução adiciona 5 OS e 1 veículo ao banco local.*
