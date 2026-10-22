# Evidências

Evidências de que a solução funciona como documentado: testes de ponta a ponta executados contra a aplicação real, cobertura dos testes automatizados e análise de vulnerabilidades.

## Testes de ponta a ponta (E2E)

Executados contra a stack real (API NestJS e PostgreSQL no Docker), por requisições HTTP, conferindo as respostas, o histórico de eventos (`GET /events/...`) e o estado do estoque (`GET /stock`).

| Relatório | Data | O que comprova | Resultado |
|---|---|---|---|
| [Fluxo completo da Ordem de Serviço](e2e-ordem-de-servico.md) | 16/10/2026 | Ciclo completo de uma OS (abertura, itens, orçamento, aprovação, pagamento, execução e entrega), cancelamento com liberação da reserva e recusa de item por estoque insuficiente (409). Confere a reserva, a baixa e a liberação do estoque em cada etapa. | ✅ OS A entregue, OS B cancelada |
| [Estatísticas das OS](e2e-estatisticas.md) | 17/10/2026 | `GET /stats`: contagens e tempos médios em diferentes períodos, foto do status em data passada, validação de entrada e autorização. | ✅ Aprovado (105 verificações, 0 falhas) |
| [Estatísticas individuais da OS](e2e-estatisticas-individuais.md) | 17/10/2026 | `GET /work-orders/:id/stats`: tempos de cada etapa de uma OS comparados com as médias da oficina, conferidos contra os eventos gravados no banco. | ✅ Aprovado |

Cada relatório registra a branch e o commit testados, o ambiente, o passo a passo e as respostas obtidas.

## Testes automatizados e cobertura

Os testes unitários e de integração ficam em [`backend/test`](../../backend/test). As instruções para rodá-los e gerar o relatório de cobertura estão no [README principal](../../README.md#testes).

## Análise de vulnerabilidades

A análise é feita com o Trivy, no GitHub Actions ([`.github/workflows/trivy.yml`](../../.github/workflows/trivy.yml)) e localmente pelo script `npm run security:scan`. A decisão e as regras estão no [ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md) e as instruções no [README principal](../../README.md#segurança-trivy).
