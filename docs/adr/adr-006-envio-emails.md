# ADR-006 — Envio de E-mails Transacionais

- **Status:** Aprovado
- **Data:** 02/10/2026
- **Atualização:** 14/10/2026 — envio passou a ser disparado por eventos de domínio
- **Autor:** Julio Cavalcanti
- **Revisores:** Felipe Santana, Kevin Villanova, Matheus Andrell, Michel Lisboa

## Contexto

O cliente da oficina precisa ser avisado sobre o andamento da sua ordem de serviço (OS), principalmente quando o orçamento fica disponível para aprovação e quando o serviço é concluído.

Para isso, a aplicação precisa enviar e-mails transacionais com conteúdo formatado (dados do cliente, veículo, itens e valores do orçamento) a partir de um remetente com domínio próprio, sem que a lógica de envio fique acoplada aos casos de uso.

Também era necessário que o projeto pudesse ser executado e avaliado sem credenciais de e-mail, e que, em ambiente de avaliação, as mensagens não fossem entregues a endereços reais de clientes cadastrados nos dados de teste.

## Decisão

Utilizar o **Resend** como provedor de envio de e-mails, acessado por meio da interface `EmailSender`, e disparar os envios a partir de **eventos de domínio**.

### Provedor

- O envio é feito pelo SDK oficial do Resend, implementado em `ResendEmailSender`, na camada de infraestrutura.
- O remetente utiliza um domínio próprio verificado no Resend (`EMAIL_FROM`).
- Os casos de uso e handlers dependem apenas das interfaces `EmailSender` e `WorkOrderNotifier`, conforme a ADR-003. A troca de provedor exige apenas uma nova implementação dessas interfaces.

### Disparo por eventos

- O `WorkOrderNotificationHandler` reage ao evento `work_order.status_changed` e envia o e-mail quando a OS passa para `awaiting_approval` (orçamento) ou `completed` (serviço concluído).
- O `ChangeWorkOrderStatusUseCase` não conhece o envio de e-mails.
- Os e-mails são montados em HTML com a identidade visual do projeto, com o logo enviado como anexo inline.

### Envio *best-effort*

- Falhas no envio são registradas em log e nunca interrompem a operação que gerou o e-mail. Uma mudança de status já gravada não é desfeita porque o e-mail falhou.
- Sem `RESEND_API_KEY`, a aplicação funciona normalmente e apenas registra em log que o e-mail não foi enviado.
- Com `EMAIL_REDIRECT_TO` configurada, todos os e-mails são entregues aos endereços informados, e não ao destinatário original, o que permite a avaliação do projeto sem enviar mensagens a terceiros.

## Alternativas consideradas

### Servidor SMTP (Nodemailer)

Envio por SMTP, usando um servidor próprio ou o SMTP de um provedor de e-mail.

Exigiria configurar e manter as credenciais e a reputação de um servidor SMTP, além de tratar diretamente questões de entrega, como SPF e DKIM, que o Resend já resolve na verificação do domínio.

**Decisão:** Não adotado.

### Amazon SES ou SendGrid

Provedores consolidados de e-mail transacional.

Ambos atenderiam ao projeto, mas exigem uma configuração inicial maior (conta na AWS e saída do modo *sandbox* do SES, por exemplo). O Resend oferece um plano gratuito suficiente para o projeto e uma API e SDK mais simples.

**Decisão:** Não adotado.

### Envio síncrono dentro do caso de uso

O caso de uso de mudança de status enviaria o e-mail diretamente.

Foi a abordagem inicial, mas acoplava a regra de negócio à notificação e fazia com que uma falha no envio pudesse afetar a operação. Foi substituída pelo disparo por eventos de domínio em 14/10/2026.

**Decisão:** Substituído.

## Consequências

### Positivas

- Novas notificações podem ser adicionadas apenas criando reações a eventos, sem alterar os casos de uso
- Indisponibilidade do provedor de e-mail não impede o funcionamento da oficina
- O projeto pode ser executado e avaliado sem credenciais de e-mail
- A troca de provedor fica restrita à camada de infraestrutura

### Negativas

- Dependência de um serviço externo e da manutenção do domínio verificado
- Como o envio é *best-effort* e não há fila nem nova tentativa, um e-mail que falhar não é reenviado automaticamente
- O envio ocorre dentro da mesma requisição que alterou a OS, o que aumenta o seu tempo de resposta
- Os templates HTML ficam no backend e precisam ser mantidos junto com o código
