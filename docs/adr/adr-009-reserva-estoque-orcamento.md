# ADR-009 — Reserva de Estoque no Envio do Orçamento

- **Status:** Aprovado
- **Data:** 10/10/2026
- **Autor:** Michel Lisboa
- **Revisores:** Felipe Santana, Julio Cavalcanti, Kevin Villanova, Matheus Andrell

## Contexto

Uma ordem de serviço (OS) pode conter serviços e peças. As peças saem do estoque da oficina, e o fluxo da OS passa por diagnóstico, envio do orçamento, aprovação ou recusa pelo cliente, execução, conclusão e entrega.

Entre o envio do orçamento e a decisão do cliente pode passar um tempo considerável. Se o estoque não for considerado nesse intervalo, a oficina pode enviar a dois clientes orçamentos que dependem da mesma peça e, após as duas aprovações, não ter peças suficientes para executar os serviços.

Era necessário definir em que momento do fluxo da OS o estoque é afetado.

## Decisão

**Reservar** as peças no envio do orçamento e **efetivar ou liberar** a reserva conforme a decisão do cliente.

### Modelo de estoque

O estoque de cada produto possui uma quantidade total (`quantity`) e uma quantidade reservada (`reserved`). A quantidade **disponível** é a diferença entre as duas. Movimentações manuais de saída não podem deixar o estoque abaixo da quantidade reservada.

### Fluxo

| Transição da OS | Efeito no estoque | Evento registrado |
|---|---|---|
| Para `awaiting_approval` (orçamento enviado) | A quantidade de cada peça é **reservada**. Se alguma peça não tiver quantidade disponível suficiente, o orçamento não é enviado. | `stock.reserved` |
| Para `approved` (orçamento aprovado) | A reserva é **consumida**: a quantidade total e a reservada diminuem, e é registrada uma movimentação de saída vinculada à OS. | `stock.consumed` |
| Para `cancelled` (orçamento recusado) | A reserva é **liberada**, e a quantidade volta a ficar disponível. | `stock.released` |

- Os itens da OS só podem ser alterados antes do envio do orçamento, o que garante que a reserva corresponda exatamente aos itens orçados.
- Os itens de serviço (reparos) não afetam o estoque.

### Consistência

- A mudança de status, as alterações de estoque, a movimentação e os eventos de estoque são gravados em uma **única transação**, por meio da *Unit of Work* da OS.
- A OS e os registros de estoque são lidos com bloqueio de escrita (`pessimistic_write`), e as peças são processadas sempre na mesma ordem, o que evita que duas OS reservem a mesma quantidade disponível ao mesmo tempo.
- As regras de reserva, consumo e liberação ficam na entidade de domínio `Stock`, que impede reservar mais do que o disponível ou consumir mais do que o reservado.

## Alternativas consideradas

### Baixa do estoque apenas na execução do serviço

O estoque seria afetado somente quando a OS entrasse em execução ou fosse concluída.

É o modelo mais simples, mas não protege o intervalo entre o orçamento e a execução: dois orçamentos poderiam ser aprovados contando com a mesma peça.

**Decisão:** Não adotado.

### Baixa definitiva no envio do orçamento

A quantidade seria retirada do estoque já no envio do orçamento e devolvida em caso de recusa.

Protegeria o estoque, mas registraria como saída peças que ainda não foram utilizadas e geraria movimentações de entrada e saída a cada orçamento recusado, poluindo o histórico de movimentações.

**Decisão:** Não adotado.

### Apenas verificar a disponibilidade, sem reservar

O envio do orçamento apenas verificaria se há quantidade suficiente, sem reservá-la.

A verificação seria válida apenas no momento do envio e não impediria que outra OS consumisse a mesma quantidade antes da aprovação.

**Decisão:** Não adotado.

## Consequências

### Positivas

- Um orçamento enviado tem as peças garantidas até a decisão do cliente
- O estoque disponível reflete o que de fato pode ser oferecido em novos orçamentos
- O histórico de movimentações registra apenas as saídas efetivas, e as reservas e liberações ficam no histórico de eventos (ADR-007)
- A transação única impede que a OS e o estoque fiquem inconsistentes entre si

### Negativas

- Peças reservadas ficam indisponíveis enquanto o cliente não decide, já que a reserva não expira sozinha
- O consumo ocorre na aprovação, e não no uso efetivo da peça; uma OS aprovada que não for executada mantém a saída registrada
- Os bloqueios de escrita podem gerar espera entre operações simultâneas sobre os mesmos produtos
- A mudança de status da OS passa a depender do estoque, o que torna a operação mais complexa e exige mais testes
