# ADR-012 — Cálculo das Estatísticas a partir do Histórico de Eventos

- **Status:** Aprovado
- **Data:** 16/10/2026
- **Atualização:** 17/10/2026 — estatísticas individuais por ordem de serviço
- **Autor:** Kevin Villanova
- **Revisores:** Felipe Santana, Julio Cavalcanti, Matheus Andrell, Michel Lisboa

## Contexto

A oficina precisa monitorar o tempo médio de execução dos serviços e acompanhar quantas ordens de serviço (OS) estão em cada etapa do fluxo. Para isso, é necessário saber quando cada OS entrou em cada status: recebimento, diagnóstico, aguardo de aprovação, aprovação, execução, conclusão e entrega.

A OS armazena apenas o seu status atual. Porém, cada mudança de status já gera o evento de domínio `work_order.status_changed`, registrado com data e hora na tabela `events` pela auditoria (ADR-008).

Era necessário definir de onde vêm os instantes de cada transição e onde as estatísticas são calculadas.

## Decisão

**Reconstruir o histórico de status de cada OS a partir dos eventos `work_order.status_changed`** e calcular as estatísticas na camada de aplicação.

### Origem dos dados

- A interface `WorkOrderStatsRepository` fornece, para cada OS, a data de criação e a lista cronológica de transições de status, conforme a ADR-003.
- A implementação em TypeORM lê as OS e os eventos de mudança de status (o novo status vem do campo `to` dos metadados do evento) em duas consultas.
- Como o histórico completo está disponível, é possível reconstruir o status de cada OS em qualquer instante, e não apenas o status atual.

### Cálculo

- Cada estatística é um objeto com código, nome, descrição e uma função de cálculo pura, registrado em uma lista única (`WORK_ORDER_STATS`). Adicionar ou remover uma estatística exige apenas alterar essa lista.
- As estatísticas incluem contadores (OS iniciadas e concluídas), a quantidade de OS em cada status ao fim do período e o tempo médio entre cada par de etapas do fluxo, como a fila para diagnóstico, o aguardo de aprovação e a execução do serviço.
- O período é informado por atalhos (`today`, `week`, `month`, `year`, `all` etc.) ou por datas de início e fim, interpretadas no fuso horário do servidor.

### Rotas

- `GET /stats` retorna as estatísticas gerais da oficina no período, restrita ao perfil `admin`.
- `GET /work-orders/:id/stats` retorna as etapas, o tempo total e o status atual de uma OS, comparados com as médias gerais da oficina. Está disponível para a equipe e para o cliente dono da OS.

## Alternativas consideradas

### Colunas de data na própria OS

A tabela de OS teria colunas como `diagnosis_started_at`, `approved_at` e `completed_at`, preenchidas a cada mudança de status.

Seria mais simples de consultar, mas exigiria uma nova coluna e uma migration para cada etapa, guardaria apenas a última vez em que a OS passou por cada status e duplicaria uma informação que os eventos já registram.

**Decisão:** Não adotado.

### Cálculo por consultas agregadas no banco

As médias e contagens seriam calculadas diretamente em SQL, com funções de agregação sobre os eventos.

Teria melhor desempenho com grande volume de dados, mas colocaria a regra de cada estatística em consultas SQL na infraestrutura, mais difíceis de testar de forma isolada e dependentes do PostgreSQL.

**Decisão:** Não adotado.

## Consequências

### Positivas

- Nenhuma alteração no modelo da OS foi necessária, já que os eventos de auditoria fornecem o histórico
- O status de qualquer OS pode ser reconstruído em qualquer instante, permitindo estatísticas de períodos passados
- As regras de cálculo ficam na camada de aplicação, testáveis sem banco de dados
- Novas estatísticas podem ser adicionadas sem alterar o restante do código

### Negativas

- As estatísticas dependem do registro de auditoria: como a gravação dos eventos ocorre fora da transação da mudança de status (ADR-008), uma falha nessa gravação faz a transição faltar nas estatísticas
- Todas as OS criadas até o fim do período e suas transições são carregadas em memória, o que perde desempenho com o crescimento do volume de dados
- A leitura dos status depende da estrutura dos metadados do evento (`metadata->>'to'`), que não é validada pelo banco
- O resultado depende do fuso horário do servidor, usado para definir o início e o fim de cada dia
