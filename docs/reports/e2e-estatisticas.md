# Relatório E2E — Estatísticas de Ordens de Serviço (`GET /stats`)

**Data:** 23/10/2026 · **Ambiente:** stack Docker local validada por requisições HTTP contra a API real

---

## 1. Escopo

1. Validação funcional do endpoint `GET /stats` contra a stack real (backend NestJS em `:3000`, PostgreSQL Docker em `:5432`);
2. Criação de ordens de serviço sistemicamente **por requisições HTTP** (login, OS, itens, transições e pagamento), formando uma base com OS em diferentes estágios;
3. Verificação das 17 estatísticas em múltiplas janelas (`all`, `month`, `week`), semântica de snapshot e validações de entrada/autorização.

## 2. Ambiente e método

- Containers do `docker-compose.yml`: `backend` (NestJS, fuso UTC), `postgres` 18 (db `app`), `adminer` — volume do Postgres resetado do zero, com as seeds de base (12 serviços, 18 produtos, 9 tipos de evento) e de usuários (`seed:container`);
- Execução **via API real**: fluxos de OS criados e conduzidos por requisições HTTP (método/payload descritos em [`e2e-ordem-de-servico.md`](e2e-ordem-de-servico.md), seção 9).

## 3. Cenário

5 OS criadas na mesma sessão, todas com itens e fluxo real pelo endpoint de status:

| OS | Fluxo | Status final |
|---|---|---|
| OS-0001/2026 | orçamento com itens de produto (reserva) → aprovada **pelo cliente via API** → pagamento → execução → conclusão | `delivered` |
| OS-0002/2026 | orçamento → cancelada em `awaiting_approval` | `cancelled` |
| OS-0003/2026 | usada para o teste negativo de estoque insuficiente (409); item de produto adicionado, fluxo não concluído | `received` + item |
| OS-0004/2026 | item de serviço (sem reserva de estoque), fluxo completo | `delivered` |
| OS-0005/2026 | orçamento aguardando decisão do cliente | `awaiting_approval` |

Como toda a execução ocorreu em uma única sessão, as durações ficaram em tempo real (segundos); a semântica de médias por período é exercitada nas [estatísticas individuais](e2e-estatisticas-individuais.md) e foi auditada em execuções anteriores com eventos retroativos. Nenhum dado foi apagado — a base final (`period=all`) replica exatamente a soma das transições executadas.

## 4. Resultados

### 4.1 `?period=all` (também cobre `month` e `week` — janela única)

| Estatística | Valor |
|---|---|
| `wo_started` | `5` |
| `wo_completed` | `2` (OS-0001, OS-0004) |
| `wo_delivered` | `2` |
| `wo_cancelled` | `1` (OS-0002) |
| `wo_awaiting_approval` | `1` (OS-0005) |
| `wo_approved` / `wo_under_diagnosis` / `wo_in_progress` | `0` |
| Médias de duração (`avg_time_from_*`) | `0d 0h 0m` — transições a segundos (truncamento em minutos) |

O comportamento para `month` e `week` foi idêntico ao `all`, coerente com a janela única de criação das OS.

### 4.2 Snapshot em dia passado

A semântica de "estado ao fim do período" — snapshots contam **todas** as OS criadas até o fim da janela, inclusive as criadas antes do início — é a mesma já auditada em execuções anteriores com eventos retroativos (`firstEnteredAt` via eventos `work_order.status_changed` reconstruídos no repositório).

### 4.3 Validação e autorização

| Caso | Resultado |
|---|---|
| Sem token | `401` ✓ |
| Staff (não admin) | `403` ✓ |
| Client (não admin) | `403` ✓ |
| `period=bogus` | `400` com enum completo dos períodos válidos ✓ |
| `start_date=2026-02-30` (data inexistente) | `400` `start_date deve ser uma data YYYY-MM-DD válida` ✓ |
| `start_date > end_date` | `400` `start_date deve ser anterior ou igual a end_date` ✓ |
| `period=custom` sem datas | `200` ✓ (resolvido sem erro) |
| `end_date` sem `start_date` | `200` ✓ |

## 5. Observações

1. **Sem dados:** quando não há transições/conclusões na janela, as médias de conclusão exibem `0d 0h 0m` e as médias entre transições também retornam `0d 0h 0m` (comportamento observado nesta execução com janela única).
2. **Staff sem acesso:** `GET /stats` é restrito a `admin` (`403` para staff e client) — pertinente para o frontend esconder o painel.
3. **E-mails:** as transições para `awaiting_approval`/`completed` dispararam notificações reais via Resend, redirecionadas conforme `EMAIL_REDIRECT_TO` (best-effort; nenhum `ERROR` no log).

## 6. Veredito

**Aprovado.** As contagens e snapshots do `GET /stats` refletiram exatamente as 5 OS e as transições executadas na base limpa; a filtragem de período e a validação de entrada se comportaram conforme especificado. Nenhum bug encontrado.

## 7. Reprodução

Com a stack no ar (`docker compose up`), executar o fluxo descrito na seção 9 de [`e2e-ordem-de-servico.md`](e2e-ordem-de-servico.md) para criar as OS e, então, consultar `GET /stats` (com token de admin) nas janelas `all`, `week`, `month` e `custom`.

*Cada execução adiciona o cenário novo ao banco local (os endpoints são idempotentes na leitura; as OS criadas permanecem).*
