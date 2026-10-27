# Linguagem Ubíqua

Termos do domínio da oficina mecânica, usados igualmente nas conversas do time, na documentação e no código. A coluna **Termo em código** mostra o nome adotado na implementação, em inglês (entidades, colunas, valores e eventos). A escolha de `repair` para Serviço está no [ADR-005](../adr/adr-005-escolha-termos-ingles.md).

## 1. Entidades Principais (Domain Entities / Aggregates)

Objetos de negócio centrais do sistema, que possuem identidade e ciclo de vida próprio.

| # | Termo | Termo em código | Definição | Exemplo |
|---|---|---|---|---|
| 1 | **Cliente** | `client` | Pessoa física ou jurídica que solicita serviços na oficina. É identificada por CPF ou CNPJ e tem acesso ao sistema para acompanhar as próprias OS. | João Silva, CPF 529.982.247-25 |
| 2 | **Veículo** | `vehicle` | Automóvel de um cliente, identificado pela placa, que será submetido a serviços na oficina. | Chevrolet Onix, placa ABC1D23, ano 2020, cor prata |
| 3 | **Ordem de Serviço (OS)** | `work_order` | Documento que registra o atendimento de um veículo: serviços, peças e insumos, orçamento, status e histórico da execução. | OS-0001/2026 para troca de óleo do veículo placa ABC1D23 |
| 4 | **Serviço** | `repair` | Atividade técnica do catálogo da oficina, executada no veículo, com valor de mão de obra. | Troca de óleo, alinhamento, balanceamento |
| 5 | **Peça/Insumo** | `product` | Material do catálogo usado na execução dos serviços. Pode ser uma peça (`PART`) ou um insumo (`CONSUMABLE`) e é identificado pelo SKU. | Filtro de óleo (peça), óleo lubrificante 5W30 (insumo) |
| 6 | **Item da OS** | `work_order_item` | Serviço ou peça/insumo incluído em uma Ordem de Serviço, com quantidade e preço unitário. Cada item é um serviço **ou** uma peça/insumo, nunca os dois. | 4 litros de óleo 5W30; 1 troca de óleo |
| 7 | **Estoque** | `stock` | Saldo de uma peça ou insumo na oficina: quantidade total, quantidade reservada para OS e quantidade disponível. | Filtro de óleo: 50 em estoque, 4 reservados, 46 disponíveis |
| 8 | **Movimentação de Estoque** | `stock_movement` | Registro de entrada, saída ou ajuste na quantidade de uma peça ou insumo, com a quantidade anterior. | Entrada de 100 litros de óleo 5W30 |
| 9 | **Colaborador** | `employee` | Funcionário da oficina que executa atividades operacionais ou administrativas. | Carlos Santos, cargo Mecânico |
| 10 | **Usuário** | `user` | Conta de acesso ao sistema, ligada ao perfil de um Cliente ou de um Colaborador e a um Papel. | `carlos.santos`, Colaborador com papel `staff` |
| 11 | **Papel (Role)** | `role` | Papel de acesso atribuído ao usuário, que define o que ele pode fazer no sistema. | `admin` (Administrador), `staff` (Equipe), `client` (Cliente) |
| 12 | **Evento** | `event` | Registro, no histórico, de um acontecimento relevante ocorrido em uma entidade do sistema. | `work_order.created` na OS-0001/2026 |
| 13 | **Tipo de Evento** | `event_type` | Catálogo dos tipos de evento que podem ser registrados no histórico, com as entidades a que cada um se aplica. | `stock.reserved`, aplicável a `stock` |

## 2. Status e Estados (State / Value Enums)

Representam os estados do ciclo de vida de uma Ordem de Serviço. Toda mudança de status exige um motivo, registrado no histórico da OS.

| # | Termo | Termo em código | Definição | Exemplo |
|---|---|---|---|---|
| 14 | **Status da OS** | `work_order_status` | Estado atual do processo de atendimento da Ordem de Serviço. | Recebida, Em diagnóstico, Aguardando aprovação, Aprovada, Em execução, Finalizada, Entregue, Cancelada |
| 15 | **Recebida** | `received` | Status inicial, quando o veículo chega à oficina e a OS é aberta. | OS-0001/2026 recebida em 15/03/2026 às 09:00 |
| 16 | **Em diagnóstico** | `under_diagnosis` | Status em que o veículo está sendo avaliado tecnicamente e os itens do orçamento são incluídos. | Mecânico inspecionando o sistema de freios |
| 17 | **Aguardando aprovação** | `awaiting_approval` | Status em que o orçamento foi enviado ao cliente e aguarda a decisão. Exige ao menos um item na OS e reserva no estoque as peças e insumos do orçamento. | Orçamento enviado ao cliente por e-mail em 15/03/2026 |
| 18 | **Aprovada** | `approved` | Status em que o cliente aprovou o orçamento. As peças e insumos reservados recebem baixa no estoque. | Cliente aprovou o orçamento em 15/03/2026 às 14:30 |
| 19 | **Em execução** | `in_progress` | Status em que os serviços aprovados estão sendo realizados. Só pode começar depois da confirmação do pagamento. | Mecânico executando a troca das pastilhas de freio |
| 20 | **Finalizada** | `completed` | Status em que todos os serviços foram concluídos. O cliente é avisado por e-mail. | Serviços finalizados em 16/03/2026 às 17:00 |
| 21 | **Entregue** | `delivered` | Status final, quando o veículo é devolvido ao cliente. | Veículo entregue ao cliente em 17/03/2026 às 10:00 |
| 22 | **Cancelada** | `cancelled` | Status final quando o cliente recusa o orçamento. A reserva de estoque é liberada. | Cliente recusou o orçamento em 15/03/2026 |

## 3. Atributos, Propriedades e Valores (Fields / Value Objects)

Campos, identificadores ou valores numéricos/monetários associados às entidades.

| # | Termo | Termo em código | Definição | Exemplo |
|---|---|---|---|---|
| 23 | **Número da OS** | `number` | Identificador único e legível da Ordem de Serviço, sequencial por ano. | OS-0001/2026 |
| 24 | **Orçamento** | `quote` | Conjunto dos itens da OS, com preços e valor total, enviado ao cliente para aprovação. | Troca de óleo R$ 80,00 + 4 L de óleo 5W30 R$ 180,00 = R$ 260,00 |
| 25 | **Preço Total** | `total_price` | Valor total da Ordem de Serviço: soma dos subtotais de todos os itens. | R$ 260,00 |
| 26 | **Preço unitário** | `unit_price` | Preço de um item da OS, copiado do catálogo no momento da inclusão. Mudanças posteriores no catálogo não alteram a OS. | Óleo 5W30: R$ 45,00 por litro |
| 27 | **Subtotal** | `subtotal` | Valor de um item da OS: quantidade × preço unitário. | 4 × R$ 45,00 = R$ 180,00 |
| 28 | **Valor do serviço** | `unit_value` | Valor de mão de obra de um serviço no catálogo. | Troca de óleo: R$ 80,00 |
| 29 | **Custo / Preço de venda** | `cost` / `sale_price` | Valor pago pela oficina e valor cobrado do cliente por uma peça ou insumo. | Filtro de óleo: custo R$ 20,00, venda R$ 35,00 |
| 30 | **Tipo de produto** | `product_type` | Classificação da peça ou insumo do catálogo. | `PART` (peça), `CONSUMABLE` (insumo) |
| 31 | **Unidade de medida** | `unit` | Unidade em que a peça ou insumo é controlado e cobrado. | `UNIT`, `LITER`, `KILOGRAM`, `METER` |
| 32 | **Quantidade reservada / disponível** | `reserved` / `available` | Parte do estoque separada para OS aguardando aprovação, e o que sobra para novas reservas (quantidade − reservada). | 50 em estoque, 4 reservados, 46 disponíveis |
| 33 | **CPF / CNPJ** | `document` / `document_type` | Documento que identifica o cliente ou colaborador, validado pelos dígitos verificadores. | CPF 529.982.247-25; CNPJ 11.222.333/0001-81 |
| 34 | **Placa** | `license_plate` | Identificador único do veículo, no padrão antigo ou no padrão Mercosul. | ABC1234, ABC1D23 |
| 35 | **Telefone** | `phone` | Telefone de contato do cliente ou colaborador, com DDD, de 10 ou 11 dígitos. | (11) 98765-4321 |

## 4. Processos, Eventos e Operações (Domain Events / Business Operations)

Ações, transações e movimentações realizadas dentro da aplicação. Os eventos de domínio ficam registrados no histórico (ver termo 12).

| # | Termo | Termo em código | Definição | Exemplo |
|---|---|---|---|---|
| 36 | **Abertura da OS** | `work_order.created` | Criação da Ordem de Serviço para um veículo. O cliente da OS é o dono do veículo. | OS-0001/2026 aberta para o veículo placa ABC1D23 |
| 37 | **Inclusão de item** | `work_order.item_added` | Inclusão de um serviço ou de uma peça/insumo na OS. Também há alteração de quantidade (`work_order.item_quantity_changed`) e remoção (`work_order.item_removed`). | Inclusão de 4 L de óleo 5W30 na OS-0001/2026 |
| 38 | **Mudança de status** | `work_order.status_changed` | Transição da OS de um status para outro, seguindo as regras de transição. | De Em diagnóstico para Aguardando aprovação |
| 39 | **Envio do orçamento** | `awaiting_approval` | Passagem da OS para Aguardando aprovação: reserva o estoque e envia ao cliente o e-mail com o orçamento e os links para aprovar ou recusar. | E-mail enviado com o orçamento de R$ 260,00 |
| 40 | **Aprovação / Recusa** | `approval` | Decisão do cliente sobre o orçamento, pela API ou pelo link do e-mail. Aprovar leva a OS para Aprovada; recusar, para Cancelada. | Cliente aprovou o orçamento em 15/03/2026 às 14:30 |
| 41 | **Confirmação de pagamento** | `work_order.payment_confirmed` | Registro de que o cliente pagou a OS aprovada. É exigida antes de iniciar a execução. | Pagamento da OS-0001/2026 confirmado em 15/03/2026 |
| 42 | **Reserva de estoque** | `stock.reserved` | Separação das peças e insumos do orçamento quando ele é enviado ao cliente. | Reservados 4 L de óleo 5W30 para a OS-0001/2026 |
| 43 | **Baixa de estoque** | `stock.consumed` | Saída definitiva das peças e insumos reservados quando o orçamento é aprovado. Gera uma movimentação de saída. | Baixa de 4 L de óleo 5W30 da OS-0001/2026 |
| 44 | **Liberação da reserva** | `stock.released` | Devolução ao disponível das peças e insumos reservados quando o orçamento é recusado. | Liberados 4 L de óleo 5W30 da OS-0002/2026 |
| 45 | **Movimentação manual** | `stock.adjusted` | Entrada, saída ou ajuste de estoque registrado pela equipe, fora de uma OS. | Entrada de 100 litros de óleo 5W30 em 15/03/2026 |
| 46 | **Notificação do cliente** | `WorkOrderNotificationHandler` | Política que envia e-mail ao cliente quando a OS vai para Aguardando aprovação (orçamento) e para Finalizada (serviço concluído). | E-mail "Serviço da OS-0001/2026 concluído" ao finalizar a OS |

## 5. Segurança e Controle de Acesso (Identity & Access Control)

Termos relacionados a usuários, papéis, regras de acesso e autenticação.

| # | Termo | Termo em código | Definição | Exemplo |
|---|---|---|---|---|
| 47 | **Papel (Role)** | `role` | Papel do usuário no sistema. Cada rota da API declara quais papéis podem acessá-la. Um papel fora da lista da rota recebe 403. | `admin`: tudo, inclusive indicadores e permissões; `staff`: atendimento, OS e estoque; `client`: as próprias OS |
| 48 | **Token de acesso (JWT)** | `access_token` | Credencial de curta duração recebida no login e enviada no cabeçalho `Authorization` de cada requisição. | `Authorization: Bearer eyJhbGciOi...` |
| 49 | **Refresh token** | `refresh_token` | Credencial opaca usada para obter um novo token de acesso sem fazer login de novo. É invalidada no logout. | `POST /auth/refresh` |
| 50 | **Link de aprovação** | `work_order_approval_token` | Link de uso único enviado por e-mail para o cliente aprovar ou recusar o orçamento sem fazer login. Tem validade e deixa de valer quando a OS é decidida por qualquer caminho. | Link válido por 72 horas para a OS-0001/2026 |
