# Architecture Decision Records (ADRs)

Registro das decisões de arquitetura do **Sistema de Gestão da Oficina Mecânica**. Cada ADR descreve o contexto, a decisão tomada, as alternativas consideradas e as consequências.

| ADR | Decisão | Status | Data |
|---|---|---|---|
| [ADR-001](adr-001-framework-backend.md) | Escolha do Framework do Backend | Aprovado | 22/09/2026 |
| [ADR-002](adr-002-banco-dados.md) | Escolha do Banco de Dados Principal | Aprovado | 22/09/2026 |
| [ADR-003](adr-003-arquitetura.md) | Escolha da Arquitetura da Aplicação | Aprovado | 22/09/2026 |
| [ADR-004](adr-004-escolha-orm.md) | Escolha do ORM da Aplicação | Aprovado | 22/09/2026 |
| [ADR-005](adr-005-escolha-termos-ingles.md) | Escolha de Termo em Inglês para Serviço | Aprovado | 02/10/2026 |
| [ADR-006](adr-006-envio-emails.md) | Envio de E-mails Transacionais | Aprovado | 02/10/2026 |
| [ADR-007](adr-007-padrao-listagem.md) | Padrão de Listagem: Paginação, Busca, Ordenação e Filtros | Aprovado | 05/10/2026 |
| [ADR-008](adr-008-eventos-dominio-auditoria.md) | Eventos de Domínio e Registro de Auditoria | Aprovado | 08/10/2026 |
| [ADR-009](adr-009-hateoas.md) | Adoção de HATEOAS nas Respostas da API | Aprovado | 09/10/2026 |
| [ADR-010](adr-010-reserva-estoque-orcamento.md) | Reserva de Estoque no Envio do Orçamento | Aprovado | 10/10/2026 |
| [ADR-011](adr-011-aprovacao-orcamento-por-email.md) | Aprovação do Orçamento da OS por Link no E-mail | Aprovado | 15/10/2026 |
| [ADR-012](adr-012-estatisticas-por-eventos.md) | Cálculo das Estatísticas a partir do Histórico de Eventos | Aprovado | 16/10/2026 |
| [ADR-013](adr-013-analise-estatica-sonarqube.md) | Análise Estática de Código com SonarQube | Aprovado | 18/10/2026 |
| [ADR-014](adr-014-analise-vulnerabilidades-trivy.md) | Análise de Vulnerabilidades com Trivy | Aprovado | 19/10/2026 |

A justificativa da escolha do banco de dados está no [ADR-002](adr-002-banco-dados.md).

## Novo ADR

1. Copie a estrutura de um ADR existente: **Status**, **Data**, **Autor**, **Revisores**, **Contexto**, **Decisão**, **Alternativas consideradas** e **Consequências**.
2. Use o próximo número livre no nome do arquivo: `adr-NNN-titulo-curto.md`.
3. Inclua o ADR na tabela acima.
