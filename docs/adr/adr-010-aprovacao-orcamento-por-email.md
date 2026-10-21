# ADR-010 — Aprovação do Orçamento da OS por Link no E-mail

- **Status:** Aprovado
- **Data:** 15/10/2026
- **Autor:** Julio Cavalcanti
- **Revisores:** Felipe Santana, Kevin Villanova, Matheus Andrell, Michel Lisboa

## Contexto

Quando o diagnóstico de uma ordem de serviço (OS) é concluído, a OS passa para o status `awaiting_approval` e o cliente recebe o orçamento por e-mail. A execução do serviço depende da decisão do cliente: aprovar ou recusar o orçamento.

A API já permitia que o cliente registrasse essa decisão pela rota autenticada `PATCH /work-orders/:id/status`. Porém, o projeto não possui frontend, e exigir que o cliente faça login e chame a API para responder a um orçamento torna o fluxo pouco prático.

Era necessário, portanto, permitir que o cliente decidisse diretamente a partir do e-mail, sem login, mas sem abrir mão da segurança: somente o cliente da OS pode decidir, uma única vez e enquanto a OS ainda estiver aguardando aprovação.

## Decisão

Enviar no e-mail de orçamento os botões **Aprovar** e **Recusar**, cada um com um link que contém um **token opaco de uso único**, vinculado à OS e ao cliente.

### Emissão do link

- O envio é feito pelo `WorkOrderNotificationHandler`, que reage ao evento de domínio `work_order.status_changed` quando a OS entra em `awaiting_approval`. O caso de uso de mudança de status não conhece o envio de e-mails (ADR-005).
- O token é gerado com bytes aleatórios. Somente o seu hash SHA-256 é gravado na tabela `work_order_approval_tokens`, junto com a OS, o cliente e a data de expiração. O valor original existe apenas no link enviado.
- A validade é configurada por `WORK_ORDER_APPROVAL_TTL_HOURS` (padrão de 72 horas).
- Um novo envio do orçamento revoga os links anteriores da mesma OS.
- Os links são montados com a variável `APP_PUBLIC_URL` (padrão `http://localhost:<PORT>`), nunca a partir do cabeçalho `Host` da requisição.

### Uso do link

- As rotas `/work-order-approvals/:token/:decision` são públicas: o próprio token funciona como credencial e só vale para a OS e o cliente a que pertence.
- O `GET` apenas exibe uma página HTML de confirmação com o orçamento e **não altera a OS**, já que filtros de e-mail e antivírus costumam abrir os links automaticamente.
- O `POST`, enviado pelo formulário da página, registra a decisão, com um motivo opcional: **aprovar** muda a OS para `approved` e **recusar** muda para `cancelled`.
- As páginas são HTML simples geradas pelo backend, pois o projeto não possui frontend.

### Registro da decisão

- A decisão é aplicada pelo mesmo `ChangeWorkOrderStatusUseCase` usado pela API, em nome do cliente identificado pelo token, e nunca por dados vindos da requisição. Assim, as regras de reserva de estoque (ADR-009) e de auditoria (ADR-007) continuam as mesmas para qualquer caminho de aprovação.
- O token é marcado como usado dentro da mesma transação da mudança de status, por meio de um `UPDATE` condicional com a OS travada, o que impede que dois cliques simultâneos gerem duas decisões.
- Quando a OS sai de `awaiting_approval` por qualquer caminho (link, API ou equipe da oficina), os links pendentes são revogados na mesma transação.
- Link inválido, expirado, já usado, revogado ou de OS fora de aprovação resulta sempre na mesma página de erro, sem indicar o motivo, para não fornecer informações a quem tentar adivinhar links.

### Tolerância a falhas

O envio de e-mails é *best-effort*: falhas são registradas em log e não desfazem a mudança de status. Se a geração do token falhar, o e-mail é enviado sem os links e orienta o cliente a responder pelo sistema.

## Alternativas consideradas

### Aprovação apenas pela API autenticada

O cliente faria login e chamaria `PATCH /work-orders/:id/status`.

Essa opção já existia e foi mantida como caminho alternativo, mas não atende sozinha ao fluxo: sem frontend, o cliente precisaria usar diretamente a API para responder a um orçamento.

**Decisão:** Mantida como caminho complementar, não como único.

### Link de um clique (decisão no `GET`)

O cliente aprovaria ou recusaria apenas abrindo o link, sem página de confirmação.

Foi descartada porque filtros de e-mail e antivírus acessam os links automaticamente para inspecioná-los, o que poderia aprovar ou recusar orçamentos sem a ação do cliente.

**Decisão:** Não adotado.

### Token JWT assinado, sem persistência

O link carregaria um JWT com a OS, o cliente e a expiração, validado apenas pela assinatura.

Foi descartada porque um token sem registro no banco não permite garantir o uso único nem revogar os links quando o orçamento é reenviado ou decidido por outro caminho.

**Decisão:** Não adotado.

## Consequências

### Positivas

- O cliente decide a partir do e-mail, sem login e sem necessidade de frontend
- As regras de negócio, a reserva de estoque e a auditoria são as mesmas em todos os caminhos de aprovação
- Um vazamento do banco não expõe tokens utilizáveis, pois apenas o hash é armazenado
- Cada link tem validade, uso único e é revogado assim que a OS é decidida
- O caso de uso de mudança de status permanece independente do envio de e-mails

### Negativas

- A API passa a expor rotas públicas, sem autenticação por JWT, que exigem cuidado na validação do token
- Qualquer pessoa com acesso ao e-mail do cliente, ou a quem ele encaminhar a mensagem, pode tomar a decisão enquanto o link for válido
- O backend passa a gerar páginas HTML, uma responsabilidade de apresentação que normalmente ficaria em um frontend
- O fluxo depende da entrega do e-mail pelo provedor externo e da configuração correta de `APP_PUBLIC_URL` em cada ambiente
