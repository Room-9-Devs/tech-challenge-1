# Glossário

Principais termos do domínio da oficina mecânica, em ordem alfabética, para consulta rápida. Inclui termos do negócio e os conceitos de DDD usados nesta documentação.

O nome de cada termo no código, com exemplos, está na [Linguagem Ubíqua](linguagem-ubiqua.md).

| Termo | Definição |
|---|---|
| **Abertura da OS** | Registro de uma nova Ordem de Serviço para um veículo quando ele chega à oficina. A OS começa com o status Recebida. |
| **Agregado** | Conceito de DDD: grupo de objetos tratado como uma unidade de consistência, acessado sempre pela sua raiz. Ex.: a Ordem de Serviço e seus itens. |
| **Ajuste de estoque** | Correção manual da quantidade de uma peça ou insumo para o valor contado, sem ficar abaixo do que está reservado. |
| **Aprovação do orçamento** | Autorização do cliente para a oficina executar os serviços e usar as peças e insumos orçados. |
| **Atendente** | Colaborador que recebe o cliente e o veículo, abre a OS, envia o orçamento, confirma o pagamento e entrega o veículo. |
| **Baixa de estoque** | Saída definitiva das peças e insumos reservados para uma OS quando o orçamento é aprovado. |
| **Bounded Context** | Conceito de DDD: fronteira dentro da qual um modelo e seus termos têm um significado único. Ex.: Ordem de Serviço, Estoque, Cadastros. |
| **Cancelamento** | Encerramento da OS quando o cliente recusa o orçamento. As peças e insumos reservados voltam a ficar disponíveis. |
| **Catálogo de serviços** | Lista dos serviços que a oficina oferece, cada um com seu valor de mão de obra. |
| **Cliente** | Pessoa física ou jurídica, dona do veículo, que solicita serviços à oficina. |
| **CNPJ** | Cadastro Nacional da Pessoa Jurídica. Documento de 14 dígitos que identifica um cliente pessoa jurídica. |
| **Colaborador** | Funcionário da oficina: atendente, mecânico ou administrador. |
| **Confirmação de pagamento** | Registro de que o cliente pagou a OS aprovada. Sem ela, a execução não pode começar. |
| **CPF** | Cadastro de Pessoas Físicas. Documento de 11 dígitos que identifica uma pessoa física. |
| **Custo** | Valor que a oficina paga por uma peça ou insumo. |
| **Diagnóstico** | Avaliação técnica do veículo pelo mecânico para identificar os serviços, peças e insumos necessários. |
| **Entrada de estoque** | Aumento da quantidade de uma peça ou insumo, por exemplo na chegada de uma compra. |
| **Entrega** | Devolução do veículo ao cliente depois que os serviços foram finalizados. Encerra a OS. |
| **Estoque disponível** | Quantidade de uma peça ou insumo que ainda pode ser usada em novos orçamentos: quantidade em estoque menos a reservada. |
| **Estoque reservado** | Quantidade de uma peça ou insumo separada para orçamentos que aguardam a decisão do cliente. |
| **Event Storming** | Técnica colaborativa de modelagem em que o time mapeia um processo pelos seus eventos, comandos, atores e políticas. |
| **Evento de domínio** | Fato relevante para o negócio que já aconteceu, descrito no passado. Ex.: OS aprovada, estoque reservado. |
| **Execução** | Realização, pelo mecânico, dos serviços aprovados pelo cliente. |
| **Histórico da OS** | Registro de tudo o que aconteceu com a OS: abertura, itens incluídos, mudanças de status com o motivo, pagamento. |
| **Insumo** | Material consumido durante o serviço e medido em quantidade, como óleo lubrificante, fluido de freio ou graxa. |
| **Item da OS** | Cada serviço ou peça/insumo incluído no orçamento de uma OS, com quantidade e preço. |
| **Liberação da reserva** | Devolução ao estoque disponível das peças e insumos reservados quando o orçamento é recusado. |
| **Link de aprovação** | Link enviado ao cliente por e-mail para aprovar ou recusar o orçamento sem fazer login. Vale uma única vez e por tempo limitado. |
| **Mão de obra** | Valor cobrado pelo trabalho do mecânico em um serviço, sem contar as peças e insumos. |
| **Mecânico** | Colaborador que diagnostica o veículo, monta o orçamento e executa os serviços. |
| **Movimentação de estoque** | Qualquer entrada, saída ou ajuste na quantidade de uma peça ou insumo, registrada com data e responsável. |
| **Número da OS** | Identificador legível da Ordem de Serviço, sequencial por ano. Ex.: OS-0001/2026. |
| **Orçamento** | Estimativa de custo da OS, com os serviços, as peças e os insumos e o valor total. É enviado ao cliente para aprovação. |
| **Ordem de Serviço (OS)** | Documento que registra todo o atendimento de um veículo, da chegada à entrega. |
| **Papel** | Conjunto de acessos de um usuário no sistema: Administrador, Equipe ou Cliente. |
| **Peça** | Componente instalado no veículo durante o serviço e controlado por unidade, como filtro de óleo ou pastilha de freio. |
| **Placa** | Identificação do veículo. Aceita o padrão antigo (ABC1234) e o padrão Mercosul (ABC1D23). |
| **Política** | No Event Storming, regra que reage a um evento e dispara uma ação. Ex.: quando o orçamento é enviado, reservar as peças. |
| **Preço de venda** | Valor cobrado do cliente por uma peça ou insumo. |
| **Raiz do agregado** | Conceito de DDD: a entidade principal de um agregado, a única pela qual os demais objetos dele são alterados. |
| **Recusa do orçamento** | Decisão do cliente de não autorizar o orçamento. Cancela a OS. |
| **Reposição de estoque** | Compra de peças e insumos para recompor o estoque. Hoje é registrada como entrada manual. |
| **Reserva de estoque** | Separação das peças e insumos de um orçamento quando ele é enviado ao cliente, para garantir que estarão disponíveis se ele aprovar. |
| **Saída de estoque** | Redução da quantidade de uma peça ou insumo, pelo consumo em uma OS ou por registro manual. |
| **Serviço** | Atividade técnica executada no veículo, como troca de óleo, alinhamento ou balanceamento. |
| **SKU** | Stock Keeping Unit. Código único que identifica cada peça ou insumo no estoque. |
| **Status da OS** | Etapa em que a OS se encontra: Recebida, Em diagnóstico, Aguardando aprovação, Aprovada, Em execução, Finalizada, Entregue ou Cancelada. |
| **Subtotal** | Valor de um item da OS: quantidade multiplicada pelo preço unitário. |
| **Tabela FIPE** | Tabela de preços médios de veículos no mercado brasileiro, publicada pela Fundação Instituto de Pesquisas Econômicas. É consultada pelo código FIPE do veículo. |
| **Tempo médio de execução** | Indicador do tempo médio que as OS levam entre etapas, por exemplo da abertura até a finalização, calculado a partir do histórico de status. |
| **Unidade de medida** | Unidade em que uma peça ou insumo é controlado e cobrado: unidade, litro, quilograma ou metro. |
| **Usuário** | Conta de acesso ao sistema de um cliente ou de um colaborador. |
| **Valor total** | Soma dos subtotais de todos os itens da OS. |
| **Veículo** | Automóvel do cliente que recebe os serviços da oficina, identificado pela placa. |
