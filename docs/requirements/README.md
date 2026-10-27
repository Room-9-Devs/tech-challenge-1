# Requisitos

Requisitos do **Sistema de Gestão da Oficina Mecânica**, conforme a solução entregue. O documento separa o que o sistema faz (requisitos funcionais), as regras do domínio que essas funções obedecem (regras de negócio), os atributos de qualidade verificáveis (requisitos não funcionais) e as decisões de construção (restrições de projeto). As limitações conhecidas estão no final.

| Prefixo | Tipo |
|---|---|
| `RF` | Requisito funcional |
| `RN` | Regra de negócio |
| `RNF` | Requisito não funcional |
| `RES` | Restrição de projeto |

**Prioridade:** *Essencial* é o núcleo do MVP (gestão de ordens de serviço, clientes, veículos, peças e estoque); *Complementar* amplia esse núcleo.

**Atores:** `admin` (Administrador), `staff` (Atendente e Mecânico), `client` (Cliente) e *sistema* (reação automática, sem ator humano). Os papéis estão descritos no [C4 — Nível 3](../c4/03-component.md#autenticação-e-autorização).

## 1. Requisitos funcionais

### Criação da Ordem de Serviço

| ID | Requisito | Ator | Prioridade | Rastreabilidade |
|---|---|---|---|---|
| RF-01 | Identificar o cliente pelo CPF ou CNPJ, com ou sem máscara. | `staff`, `admin` | Essencial | `GET /users` (filtros `cpf`, `cnpj`, `profile.document`) |
| RF-02 | Cadastrar o cliente, pessoa física ou jurídica, junto com o seu usuário de acesso. | `staff`, `admin` | Essencial | `POST /users` (`entityType: client`) |
| RF-03 | Cadastrar o veículo do cliente com placa, marca, modelo, ano e cor. | `staff`, `admin` | Essencial | `POST /vehicles/:user_id` |
| RF-04 | Consultar o preço do veículo na tabela FIPE pelo código FIPE. | `staff`, `admin` | Complementar | `GET /vehicles/fipe/:code` |
| RF-05 | Abrir a OS para um veículo. O cliente da OS é o dono do veículo, e a OS recebe um número sequencial por ano (`OS-0001/2026`). | `staff`, `admin` | Essencial | `POST /work-orders` |
| RF-06 | Incluir, alterar a quantidade e remover serviços, peças e insumos da OS. | `staff`, `admin` | Essencial | `POST /work-orders/:id/items`, `PATCH` e `DELETE /work-orders/:id/items/:itemId` |
| RF-07 | Gerar o orçamento automaticamente a partir dos preços do catálogo. | *sistema* | Essencial | `WorkOrderQuoteService`, `WorkOrder.totalPrice` |
| RF-08 | Enviar o orçamento ao cliente para aprovação, por e-mail. | `staff`, `admin` | Essencial | `PATCH /work-orders/:id/status` (`awaiting_approval`), `WorkOrderNotificationHandler` |
| RF-09 | Registrar a aprovação ou a recusa do orçamento pela API. | `client` | Essencial | `PATCH /work-orders/:id/status` (`approved`, `cancelled`) |
| RF-10 | Registrar a aprovação ou a recusa do orçamento pelo link do e-mail, sem login. | `client` | Complementar | `GET` e `POST /work-order-approvals/:token/:decision`, [ADR-011](../adr/adr-011-aprovacao-orcamento-por-email.md) |

### Acompanhamento da Ordem de Serviço

| ID | Requisito | Ator | Prioridade | Rastreabilidade |
|---|---|---|---|---|
| RF-11 | Alterar o status da OS conforme as etapas do atendimento: Recebida, Em diagnóstico, Aguardando aprovação, Aprovada, Em execução, Finalizada, Entregue e Cancelada. | `staff`, `admin` | Essencial | `PATCH /work-orders/:id/status` |
| RF-12 | Confirmar o pagamento da OS aprovada. | `staff`, `admin` | Complementar | `POST /work-orders/:id/payment-confirmation` |
| RF-13 | Consultar o andamento das próprias OS pela API. | `client` | Essencial | `GET /work-orders`, `GET /work-orders/:id` |
| RF-14 | Avisar o cliente por e-mail quando o serviço for concluído. | *sistema* | Complementar | `WorkOrderNotificationHandler` |

### Gestão administrativa

| ID | Requisito | Ator | Prioridade | Rastreabilidade |
|---|---|---|---|---|
| RF-15 | Listar, consultar, alterar e excluir clientes (exclusão lógica). | `staff`, `admin` (exclusão só `admin`) | Essencial | `GET /users`, `GET`, `PATCH` e `DELETE /users/:id` |
| RF-16 | Listar, consultar, alterar e excluir veículos. | `staff`, `admin` | Essencial | `GET /vehicles`, `GET`, `PUT` e `DELETE /vehicles/:id` |
| RF-17 | Manter o catálogo de serviços (exclusão lógica). O cliente apenas consulta. | `staff`, `admin`; `client` (leitura) | Essencial | `/repairs` |
| RF-18 | Manter o catálogo de peças e insumos, com inativação e reativação. | `staff`, `admin` | Essencial | `/products`, `PATCH /products/:id/activate` |
| RF-19 | Consultar o saldo de estoque de cada produto: quantidade, reservado e disponível. | `staff`, `admin` | Essencial | `GET /stock` |
| RF-20 | Registrar movimentações manuais de estoque (entrada, saída e ajuste) e consultar o histórico de movimentações. | `staff`, `admin` | Essencial | `POST` e `GET /stock/movements` |
| RF-21 | Listar as OS, com paginação, busca, ordenação e filtros, e detalhar uma OS. | `staff`, `admin` | Essencial | `GET /work-orders`, `GET /work-orders/:id`, [ADR-007](../adr/adr-007-padrao-listagem.md) |
| RF-22 | Exibir os indicadores das OS por período, incluindo o tempo médio de execução dos serviços. | `admin` | Essencial | `GET /stats`, [ADR-012](../adr/adr-012-estatisticas-por-eventos.md) |
| RF-23 | Exibir os tempos de cada etapa de uma OS, comparados às médias da oficina. | `staff`, `admin`, `client` (dono da OS) | Complementar | `GET /work-orders/:id/stats` |
| RF-24 | Consultar o histórico de auditoria de uma entidade e registrar eventos manualmente. | `staff`, `admin` | Complementar | `GET /events/:entityType/:entityId`, `POST /events`, [ADR-008](../adr/adr-008-eventos-dominio-auditoria.md) |
| RF-25 | Manter o catálogo de tipos de evento. | `staff`, `admin` | Complementar | `/event-types` |

### Acesso

| ID | Requisito | Ator | Prioridade | Rastreabilidade |
|---|---|---|---|---|
| RF-26 | Autenticar o usuário por nome de usuário ou e-mail e senha, renovar a sessão e encerrá-la. | Todos | Essencial | `POST /auth/login`, `/auth/refresh` e `/auth/logout` |
| RF-27 | Trocar a própria senha. | Todos (autenticados) | Complementar | `PATCH /auth/password` |
| RF-28 | Consultar os próprios dados. | Todos (autenticados) | Complementar | `GET /users/me` |
| RF-29 | Cadastrar colaboradores. | `admin` | Complementar | `POST /users` (`entityType: employee`) |
| RF-30 | Listar os papéis e alterar o papel de um usuário. | `admin` | Complementar | `GET /permissions/roles`, `PATCH /permissions/users/:userId/role` |

## 2. Regras de negócio

| ID | Regra | Onde é aplicada |
|---|---|---|
| RN-01 | A OS só aceita as transições `received` → `under_diagnosis` → `awaiting_approval` → `approved` → `in_progress` → `completed` → `delivered`, e `awaiting_approval` → `cancelled`. | `WorkOrder.changeStatus` |
| RN-02 | Toda mudança de status exige um motivo, registrado no histórico da OS. | `PATCH /work-orders/:id/status` |
| RN-03 | A OS só vai para Aguardando aprovação com ao menos um item. | `WorkOrder.changeStatus` |
| RN-04 | Os itens só podem ser incluídos, alterados ou removidos enquanto a OS está Recebida ou Em diagnóstico. | `WorkOrder.ensureItemsCanChange` |
| RN-05 | Cada item é um serviço **ou** uma peça/insumo, com quantidade maior que zero (inteira para peças e insumos), e não pode ser incluído duas vezes. | `WorkOrderItem.create`, `WorkOrder.addItem`, `CHECK` no banco |
| RN-06 | O preço unitário do item é copiado do catálogo na inclusão; alterações posteriores no catálogo não mudam a OS. O total é sempre a soma dos subtotais. | `WorkOrderQuoteService`, `WorkOrder.totalPrice` |
| RN-07 | Produto inativo não pode ser incluído em novas OS. | `Product` |
| RN-08 | O envio do orçamento reserva as peças e insumos da OS. Se algum não tiver quantidade disponível suficiente, o orçamento não é enviado. | `Stock.reserve`, [ADR-010](../adr/adr-010-reserva-estoque-orcamento.md) |
| RN-09 | A aprovação consome a reserva e registra uma saída (`OUT`) vinculada à OS; a recusa libera a reserva. | `Stock.consumeReservation`, `Stock.releaseReservation` |
| RN-10 | A execução só começa depois da confirmação do pagamento. | `ChangeWorkOrderStatusUseCase` |
| RN-11 | O cliente só altera o status da própria OS, e apenas de Aguardando aprovação para Aprovada ou Cancelada. | `ChangeWorkOrderStatusUseCase` |
| RN-12 | Saídas e ajustes manuais nunca deixam o estoque abaixo da quantidade reservada. | `Stock.applyMovement` |
| RN-13 | O link de aprovação vale uma única vez, expira em `WORK_ORDER_APPROVAL_TTL_HOURS` (padrão 72 horas) e é revogado quando a OS sai de Aguardando aprovação por qualquer caminho. | Use cases de `work-order-approvals` |
| RN-14 | O papel precisa ser compatível com o perfil: Cliente só tem `client`; Colaborador tem `staff` ou `admin`. Só o `admin` cadastra colaboradores, que recebem o papel `staff`. | `User`, `CreateUserUseCase` |
| RN-15 | CPF e CNPJ (inclusive o CNPJ alfanumérico) precisam ter dígitos verificadores válidos; o telefone tem 10 ou 11 dígitos, com DDD. | `Cpf`, `Cnpj`, `Phone` |
| RN-16 | A placa segue o padrão antigo (ABC1234) ou Mercosul (ABC1D23) e é única; o ano do veículo fica entre 1886 e o ano seguinte ao atual. | `Vehicle` |
| RN-17 | SKU é único; nome de usuário, e-mail e descrição do serviço são únicos entre os registros ativos. | `Product`, `User`, `Repair` e índices únicos |

## 3. Requisitos não funcionais

| ID | Categoria | Requisito | Critério de verificação | Evidência |
|---|---|---|---|---|
| RNF-01 | Segurança | As rotas administrativas exigem autenticação e respeitam o papel do usuário. | Sem token válido: **401**; papel fora do permitido: **403**. | [Coleção do Postman](../api/README.md), relatórios E2E |
| RNF-02 | Segurança | Senhas e tokens (refresh e aprovação) nunca são armazenados em texto puro. | O banco guarda apenas hashes (scrypt para senhas, SHA-256 para tokens de aprovação). | [Modelo de dados](../database/README.md) |
| RNF-03 | Segurança | A sessão de acesso é curta e revogável. | Token de acesso expira em 15 minutos; o refresh token anterior deixa de valer a cada renovação e no logout. | [README principal](../../README.md#usuários-de-demonstração-e-autenticação) |
| RNF-04 | Segurança | As páginas públicas de aprovação não expõem o token nem permitem desvio do link. | Páginas sem JavaScript, com `Content-Security-Policy`, `Referrer-Policy: no-referrer` e `Cache-Control: no-store`; links montados com `APP_PUBLIC_URL`, nunca com o cabeçalho `Host`. | [ADR-011](../adr/adr-011-aprovacao-orcamento-por-email.md) |
| RNF-05 | Segurança | Dependências, imagem Docker e configuração sem vulnerabilidades graves corrigíveis, e nenhum *secret* versionado. | Zero achados `HIGH`/`CRITICAL` com correção disponível no Trivy, executado em todo PR, em push para `main`/`develop` e semanalmente. | [Análise de vulnerabilidades](../reports/analise-vulnerabilidades-trivy.md) |
| RNF-06 | Consistência | Operações que alteram mais de um registro são atômicas. | Uma falha em qualquer passo não grava nada (cadastro de usuário, de produto, movimentação de estoque e mudança de status da OS). | [Testes de integração](../reports/integracao-fluxo-os.md) |
| RNF-07 | Concorrência | Operações simultâneas não geram estado inválido. | Duas OS não reservam a mesma quantidade disponível; dois cliques no link não geram duas decisões; números de OS não se repetem. | [Testes de integração](../reports/integracao-fluxo-os.md), [Modelo de dados](../database/README.md#numeração-da-os) |
| RNF-08 | Resiliência | Falhas em e-mail e auditoria não afetam a operação de negócio. | Falha no envio de e-mail ou na gravação de auditoria é registrada em log e não desfaz a operação. | [ADR-006](../adr/adr-006-envio-emails.md), [ADR-008](../adr/adr-008-eventos-dominio-auditoria.md), pasta *Resiliência da auditoria* do Postman |
| RNF-09 | Resiliência | A aplicação funciona sem as credenciais dos serviços externos. | Sem `RESEND_API_KEY`, apenas não envia e-mails; sem `FIPE_API_TOKEN`, usa a cota pública. | [README principal](../../README.md#configuração-do-ambiente) |
| RNF-10 | Integração | A consulta à FIPE tem limites e erros previsíveis. | No máximo 4 chamadas simultâneas e prazo total de 10 segundos; cota esgotada retorna **503**, timeout **504** e falha externa **502**. | [README principal](../../README.md#consulta-fipe) |
| RNF-11 | Limites operacionais | Nenhuma listagem retorna todos os registros de uma vez. | Paginação obrigatória, com no máximo 100 itens por página. | [ADR-007](../adr/adr-007-padrao-listagem.md) |
| RNF-12 | Rastreabilidade | Toda alteração relevante deixa registro auditável. | Cada evento é imutável e guarda tipo, entidade, autor, data e metadados. | [Eventos de Domínio](../ddd/eventos-de-dominio.md) |
| RNF-13 | Qualidade | Os domínios críticos são cobertos por testes automatizados. | Cobertura mínima de 80% de linhas em cada domínio crítico. | [Cobertura dos testes](../reports/cobertura-testes.md) |
| RNF-14 | Testabilidade | As regras são testáveis sem infraestrutura, e os fluxos principais são testados contra o banco real. | Testes unitários sem banco nem rede; testes de integração em base PostgreSQL isolada. | [Cobertura dos testes](../reports/cobertura-testes.md), [Testes de integração](../reports/integracao-fluxo-os.md) |
| RNF-15 | Documentação | Todas as rotas da API são documentadas. | Especificação OpenAPI disponível em `/docs`. | [API](../api/README.md) |
| RNF-16 | Implantação | O ambiente completo sobe localmente com um comando. | `docker compose up` sobe a API e o banco e aplica as migrations; o README traz as instruções de execução local. | [README principal](../../README.md#como-executar) |
| RNF-17 | Privacidade | O sistema pode ser avaliado sem enviar e-mails a terceiros. | Com `EMAIL_REDIRECT_TO`, todos os e-mails vão para o endereço configurado. | [ADR-006](../adr/adr-006-envio-emails.md) |
| RNF-18 | Segurança | O login e a renovação de token resistem a tentativas repetidas. | No máximo 20 tentativas por minuto por IP (configurável por `AUTH_THROTTLE_LIMIT`); acima disso, **429**. Cada tentativa registra o IP e o User-Agent de origem. | [Análise OWASP Top 10](../reports/analise-owasp-top-10.md) |

## 4. Restrições de projeto

| ID | Restrição | Decisão |
|---|---|---|
| RES-01 | Back-end monolítico, organizado em camadas segundo a Clean Architecture, com DDD. | [ADR-003](../adr/adr-003-arquitetura.md) |
| RES-02 | NestJS e TypeScript sobre Node.js 24. | [ADR-001](../adr/adr-001-framework-backend.md) |
| RES-03 | PostgreSQL como banco de dados principal. | [ADR-002](../adr/adr-002-banco-dados.md) |
| RES-04 | TypeORM, com o schema versionado por migrations (`synchronize: false`). | [ADR-004](../adr/adr-004-escolha-orm.md) |
| RES-05 | Termos do domínio em inglês no código, com `Repair` para Serviço. | [ADR-005](../adr/adr-005-escolha-termos-ingles.md) |
| RES-06 | Resend como provedor de e-mail. | [ADR-006](../adr/adr-006-envio-emails.md) |
| RES-07 | API RESTful com HATEOAS. | [ADR-009](../adr/adr-009-hateoas.md) |
| RES-08 | Autenticação por JWT nas rotas administrativas. | [README principal](../../README.md#usuários-de-demonstração-e-autenticação) |
| RES-09 | Execução em containers, com `Dockerfile` e `docker-compose.yml`. | [C4 — Nível 2](../c4/02-container.md#execução) |
| RES-10 | SonarQube para análise estática e Trivy para análise de vulnerabilidades. | [ADR-013](../adr/adr-013-analise-estatica-sonarqube.md), [ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md) |

## 5. Limitações conhecidas

- **Mudança de status manual.** Toda transição é uma ação explícita da equipe ou do cliente; nenhuma ocorre sozinha. Por exemplo, a confirmação do pagamento não inicia a execução. O sistema valida a transição e aplica os efeitos automaticamente (estoque e notificações).
- **Sem orçamento complementar.** Depois do envio do orçamento, a OS não aceita novos itens, e o cliente só pode aprovar ou recusar o orçamento inteiro.
- **Reserva sem expiração.** As peças reservadas ficam indisponíveis enquanto o cliente não decide.
- **Sem política de reposição de estoque.** Não há estoque mínimo nem alerta; a reposição é uma entrada manual.
- **E-mails sem reenvio.** O envio é *best-effort*, sem fila nem nova tentativa.
- **Auditoria fora da transação.** Os eventos gravados pelos *handlers* podem ser perdidos se a aplicação falhar logo após a operação, o que também afeta as estatísticas.
- **Estatísticas calculadas em memória.** O cálculo perde desempenho à medida que o volume de OS cresce.
- **Sem meta de tempo de resposta.** O projeto não define requisitos de desempenho além dos limites do RNF-10 e do RNF-11.
- **SonarQube fora do CI.** A análise estática é executada manualmente e não bloqueia *pull requests*.
