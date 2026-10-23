# Evidências

Evidências de que a solução funciona como documentado: testes de ponta a ponta executados contra a aplicação real, cobertura dos testes automatizados e análise de vulnerabilidades.

## Testes de ponta a ponta (E2E)

Executados contra a stack real (API NestJS e PostgreSQL no Docker), por requisições HTTP, conferindo as respostas, o histórico de eventos (`GET /events/...`) e o estado do estoque (`GET /stock`).

| Relatório | Data | O que comprova | Resultado |
|---|---|---|---|
| [Fluxo completo da Ordem de Serviço](e2e-ordem-de-servico.md) | 23/10/2026 | Ciclo completo de uma OS (abertura, itens, orçamento, aprovação, pagamento, execução e entrega), cancelamento com liberação da reserva e recusa de item por estoque insuficiente (409). Confere a reserva, a baixa e a liberação do estoque em cada etapa. | ✅ OS A entregue, OS B cancelada |
| [Estatísticas das OS](e2e-estatisticas.md) | 23/10/2026 | `GET /stats`: contagens e snapshots de status em diferentes períodos, validação de entrada e autorização (apenas admin). | ✅ Aprovado |
| [Estatísticas individuais da OS](e2e-estatisticas-individuais.md) | 23/10/2026 | `GET /work-orders/:id/stats`: tempos de cada etapa de uma OS comparados com as médias da oficina, conferidos contra os eventos gravados no banco. | ✅ Aprovado |

Cada relatório registra a branch e o commit testados, o ambiente, o passo a passo e as respostas obtidas.

## Testes de integração (banco real)

Executados via use cases reais contra um PostgreSQL isolado (schema temporário `regression_*` com migrations aplicadas), sem HTTP, verificando o estado persistido por SQL. São opt-in (`RUN_DATABASE_INTEGRATION_TESTS=true`) contra a base `app_test` em `localhost:5433`.

| Relatório | Data | O que comprova | Resultado |
|---|---|---|---|
| [Fluxos principais da Ordem de Serviço](integracao-fluxo-os.md) | 22/10/2026 | Ciclo completo da OS (criação → entrega) com reserva, baixa e liberação de estoque na decisão do cliente, pagamento obrigatório, rollback de inclusão e de reserva em concorrência, regras de transição/travamento de itens e isolamento entre clientes. | ✅ 7 testes (12 com a regressão de usuário/veículo), 0 falhas |

## Testes automatizados e cobertura

Os testes unitários e de integração ficam em [`backend/test`](../../backend/test). As instruções para rodá-los e gerar o relatório de cobertura estão no [README principal](../../README.md#testes).

| Relatório | Data | O que comprova | Resultado |
|---|---|---|---|
| [Cobertura dos testes automatizados](cobertura-testes.md) | 22/10/2026 | Cobertura dos testes unitários (`npm run test:cov:unit`) com as exclusões do SonarQube, por camada e por domínio crítico, frente à meta de 80% do [ADR-013](../adr/adr-013-analise-estatica-sonarqube.md). | ✅ 784 testes, 86,25% de linhas; todos os domínios críticos acima de 80% |

## Análise de vulnerabilidades

A análise é feita com o Trivy, no GitHub Actions ([`.github/workflows/trivy.yml`](../../.github/workflows/trivy.yml)) e localmente pelo script `npm run security:scan`. A decisão e as regras estão no [ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md) e as instruções no [README principal](../../README.md#análise-de-vulnerabilidades-trivy).

| Relatório | Data | O que comprova | Resultado |
|---|---|---|---|
| [Análise de vulnerabilidades com Trivy](analise-vulnerabilidades-trivy.md) | 22/10/2026 | Dependências (`package-lock.json`), *secrets*, configuração do `Dockerfile` e imagem Docker do backend (SO e pacotes Node.js), além das correções feitas desde a primeira análise. | ✅ 0 `HIGH`/`CRITICAL` com correção disponível |
