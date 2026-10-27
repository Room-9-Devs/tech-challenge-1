# Documentação

Documentação do **Sistema de Gestão da Oficina Mecânica**, o back-end (MVP) do Tech Challenge da Fase 1 (SOAT — FIAP). As instruções de instalação, execução e testes estão no [README principal](../README.md).

| Pasta | Conteúdo |
|---|---|
| [requirements](requirements/README.md) | Requisitos funcionais, regras de negócio, requisitos não funcionais, restrições de projeto e limitações conhecidas, com a rastreabilidade para rotas, ADRs e evidências. |
| [ddd](ddd/README.md) | Documentação de Domain-Driven Design: Event Storming, modelo de domínio (bounded contexts, Context Map, agregados, entidades e objetos de valor), eventos de domínio, Linguagem Ubíqua, glossário e relação com o código. |
| [c4](c4/README.md) | Arquitetura no modelo C4: contexto, containers, componentes e código (componente Ordem de Serviço). |
| [database](database/README.md) | Modelo de dados: DER conceitual e DER físico (PostgreSQL), referências polimórficas, constraints e índices. |
| [adr](adr/README.md) | Architecture Decision Records: as 14 decisões de arquitetura, como framework, banco de dados, arquitetura, e-mails, HATEOAS, reserva de estoque e análise de vulnerabilidades. |
| [das](das/das-001-sistema-gestao-oficina.md) | Design Approval Sheet: objetivo, escopo incluído e excluído, tecnologias, arquitetura, diagrama de sequência do fluxo de orçamento, riscos e mitigações e checklist de qualidade. |
| [api](api/README.md) | Uso da API: Swagger/OpenAPI, coleção do Postman e usuários de demonstração. |
| [reports](reports/README.md) | Evidências de funcionamento: relatórios de testes E2E, cobertura dos testes e análise de vulnerabilidades. |

## Por onde começar

1. **Visão geral do sistema:** [C4 — Nível 1: Contexto](c4/01-system-context.md) e [Nível 2: Containers](c4/02-container.md).
2. **Domínio:** [Modelo de Domínio](ddd/modelo-de-dominio.md) e [Linguagem Ubíqua](ddd/linguagem-ubiqua.md).
3. **Como a API é organizada:** [C4 — Nível 3: Componentes](c4/03-component.md).
4. **Por que foi feito assim:** [ADRs](adr/README.md).
5. **Usar a API:** [Swagger e Postman](api/README.md).
