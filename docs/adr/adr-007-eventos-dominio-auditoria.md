# ADR-007 — Eventos de Domínio e Registro de Auditoria

- **Status:** Aprovado
- **Data:** 08/10/2026
- **Autor:** Michel Lisboa
- **Revisores:** Felipe Santana, Julio Cavalcanti, Kevin Villanova, Matheus Andrell

## Contexto

A oficina precisa de um histórico do que acontece com cada entidade do sistema: quando um veículo foi cadastrado, quem alterou o status de uma ordem de serviço (OS), quando um produto foi reservado no estoque, quem fez login e assim por diante.

Registrar esse histórico diretamente em cada caso de uso misturaria a regra de negócio com a auditoria e espalharia código repetido pelo projeto. Além disso, outras reações a acontecimentos do sistema, como o envio de e-mails, também precisariam ser acopladas aos casos de uso.

Era necessário, portanto, definir como os acontecimentos do domínio são comunicados e como o histórico é armazenado.

## Decisão

Adotar **eventos de domínio** publicados **em memória**, e registrar a auditoria em uma **tabela única de eventos**, classificada por um catálogo de tipos de evento.

### Eventos de domínio

- Os casos de uso publicam eventos ao final de cada operação, por exemplo `vehicle.created` e `work_order.status_changed`, seguindo a convenção `{dominio}.{acao}` com o verbo no passado.
- A publicação é feita por meio das interfaces `DomainEventPublisher` e `DomainEventSubscriber`, implementadas na infraestrutura com a biblioteca `eventemitter2`, conforme a ADR-003.
- Os *handlers* são registrados na inicialização da aplicação e executados no mesmo processo. A publicação aguarda os *handlers* terminarem.
- Uma falha em um *handler* é registrada em log e não interrompe a operação que publicou o evento.

### Auditoria

- *Handlers* de auditoria, um por contexto (usuário, cliente, funcionário, veículo, produto, estoque, reparo, autenticação e OS), gravam cada evento na tabela `events`.
- A tabela `events` é **polimórfica**: cada registro aponta para a entidade por `(entity_type, entity_id)` e guarda uma nota, metadados em JSON (`jsonb`) e o autor da ação.
- A tabela `event_types` funciona como catálogo dos tipos de evento, com código, nome e as entidades que podem gerá-lo. Os tipos padrão são criados por *seed* na inicialização, e novos tipos podem ser cadastrados pela API.
- O histórico de uma entidade é consultado por `GET /events/:entityType/:entityId`, e eventos manuais podem ser registrados por `POST /events`, ambos restritos aos perfis `admin` e `staff`.
- Eventos que fazem parte da própria regra de negócio, como a reserva de estoque de uma OS, são gravados dentro da mesma transação da operação, e não pelos *handlers*.

A lista completa de eventos está documentada em `docs/events.md`.

## Alternativas consideradas

### Broker de mensagens (RabbitMQ, Kafka)

Os eventos seriam publicados em um broker externo e consumidos de forma assíncrona.

Garantiria a entrega e permitiria processamento fora da requisição, mas exigiria mais um serviço para executar e manter. Para uma aplicação monolítica, com todos os consumidores no mesmo processo, essa complexidade não se justifica neste momento.

**Decisão:** Não adotado.

### Uma tabela de histórico por entidade

Cada entidade teria sua própria tabela de histórico, como `vehicle_history` e `work_order_history`.

Permitiria colunas específicas para cada entidade, mas multiplicaria tabelas, repositórios e consultas com a mesma estrutura. A tabela única com metadados em JSON atende a todas as entidades e permite consultar o histórico de forma uniforme.

**Decisão:** Não adotado.

### Gravação da auditoria diretamente nos casos de uso

Cada caso de uso chamaria o registro de auditoria ao final da operação.

Seria mais simples e explícito, mas acoplaria a auditoria à regra de negócio e não permitiria que outras reações, como o envio de e-mails (ADR-005), aproveitassem os mesmos acontecimentos.

**Decisão:** Não adotado.

## Consequências

### Positivas

- Os casos de uso não conhecem a auditoria nem as notificações
- Novas reações a acontecimentos do sistema são adicionadas sem alterar os casos de uso
- O histórico de qualquer entidade é consultado da mesma forma
- Os tipos de evento são documentados e validados por um catálogo

### Negativas

- Os eventos tratados pelos *handlers* são gravados fora da transação da operação: se a aplicação falhar entre a operação e a gravação, o registro de auditoria pode ser perdido
- A publicação síncrona faz com que os *handlers* aumentem o tempo de resposta da requisição
- Por estarem em memória, os eventos não podem ser consumidos por outros serviços nem reprocessados
- Os metadados em JSON não possuem uma estrutura validada pelo banco, e as consultas sobre eles são menos eficientes
