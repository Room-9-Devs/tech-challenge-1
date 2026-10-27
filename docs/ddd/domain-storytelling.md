# Domain Storytelling

Histórias do domínio da oficina contadas na notação de **Domain Storytelling**: atores executam atividades sobre objetos de trabalho, em frases numeradas na ordem em que acontecem. As histórias complementam o [Event Storming](README.md#event-storming): enquanto o Event Storming parte dos eventos, aqui o ponto de partida é quem faz o quê.

São quatro cenários. O primeiro mostra o atendimento **como é hoje** (AS IS), a partir das dores relatadas pela oficina; os outros três mostram o atendimento **como passa a ser** com o sistema (TO BE). Como a notação não tem condicionais nem retornos, aprovação e recusa do orçamento são cenários separados.

## Como ler

| Elemento | Representação | Exemplo |
|---|---|---|
| **Ator** | Forma arredondada, em azul; aparece uma única vez por história | 👤 Atendente, 🖥️ Sistema |
| **Objeto de trabalho** | Retângulo, em cinza; aparece em cada frase em que é usado | 🚗 Veículo, 📋 OS, 💰 Orçamento |
| **Atividade** | Seta numerada com o verbo; a segunda seta traz a preposição até o destinatário | **1.** Cliente **entrega** Veículo **ao** Atendente |
| **Anotação** | Caixa tracejada em amarelo | Regra ou detalhe da atividade |
| **Problema** | Caixa tracejada em vermelho (só no AS IS) | Dor do processo atual |

> **Notação.** Os diagramas usam `flowchart` do Mermaid para representar a notação do Domain Storytelling, para que fiquem versionados junto com a documentação. Os PNGs usam o layout **ELK**, que organiza melhor as setas; no GitHub, os blocos aparecem com o layout padrão (ver [Atualizar os diagramas](../c4/README.md#atualizar-os-diagramas)).

## 1. AS IS — Atendimento atual

1. O **Cliente** entrega o **Veículo** ao **Atendente**.
2. O **Atendente** anota os dados do cliente e do veículo na **Ficha de papel**.
3. O **Atendente** repassa a **Ficha** ao **Mecânico**.
4. O **Mecânico** diagnostica o **Veículo**.
5. O **Mecânico** anota os serviços e as peças na **Ficha**.
6. O **Atendente** confere as peças na **Planilha de estoque**.
7. O **Atendente** calcula o orçamento na **Planilha**.
8. O **Atendente** informa o **Orçamento** por telefone ao **Cliente**.
9. O **Cliente** autoriza o **Orçamento** por telefone ao **Atendente**.
10. O **Mecânico** executa os serviços no **Veículo**.
11. O **Atendente** entrega o **Veículo** ao **Cliente**.

```mermaid
flowchart LR
  cliente(["👤 Cliente"])
  atendente(["👤 Atendente"])
  mecanico(["👤 Mecânico"])

  v1["🚗 Veículo"]
  f1["📝 Ficha de papel"]
  f2["📝 Ficha"]
  v2["🚗 Veículo"]
  f3["📝 Ficha"]
  pl1["📊 Planilha de estoque"]
  pl2["📊 Planilha"]
  orc1["💰 Orçamento"]
  orc2["💰 Orçamento"]
  v3["🚗 Veículo"]
  v4["🚗 Veículo"]

  cliente -->|"1. entrega"| v1 -->|"ao"| atendente
  atendente -->|"2. anota cliente e veículo na"| f1
  atendente -->|"3. repassa"| f2 -->|"ao"| mecanico
  mecanico -->|"4. diagnostica"| v2
  mecanico -->|"5. anota serviços e peças na"| f3
  atendente -->|"6. confere as peças na"| pl1
  atendente -->|"7. calcula o orçamento na"| pl2
  atendente -->|"8. informa por telefone"| orc1 -->|"ao"| cliente
  cliente -->|"9. autoriza por telefone"| orc2 -->|"ao"| atendente
  mecanico -->|"10. executa os serviços no"| v3
  atendente -->|"11. entrega"| v4 -->|"ao"| cliente

  p1["A ficha pode se perder: o histórico de clientes e veículos não fica registrado"]
  f1 -.- p1
  p2["A peça não é reservada: dois orçamentos podem contar com a mesma unidade"]
  pl1 -.- p2
  p3["A autorização não fica registrada"]
  orc2 -.- p3

  classDef ator fill:#dbe4ff,stroke:#364fc7,color:#1c2a6b
  classDef objeto fill:#f1f3f5,stroke:#495057,color:#212529
  classDef problema fill:#ffe3e3,stroke:#e03131,color:#7a1414,stroke-dasharray:4 3
  class cliente,atendente,mecanico ator
  class v1,f1,f2,v2,f3,pl1,pl2,orc1,orc2,v3,v4 objeto
  class p1,p2,p3 problema
```

> **Imagem:** [domain-storytelling-1-atendimento-as-is.png](domain-storytelling-1-atendimento-as-is.png)

## 2. TO BE — Abertura da OS e envio do orçamento

1. O **Cliente** entrega o **Veículo** ao **Atendente**.
2. O **Atendente** identifica o cliente pelo **CPF/CNPJ** no **Sistema**.
3. O **Atendente** cadastra o **Veículo** no **Sistema**.
4. O **Atendente** abre a **OS** no **Sistema**.
5. O **Mecânico** diagnostica o **Veículo**.
6. O **Mecânico** inclui os **Serviços e peças** na OS, no **Sistema**.
7. O **Sistema** calcula o **Orçamento**.
8. O **Atendente** envia o **Orçamento** ao **Cliente**.

```mermaid
flowchart LR
  cliente(["👤 Cliente"])
  atendente(["👤 Atendente"])
  mecanico(["👤 Mecânico"])
  sistema(["🖥️ Sistema"])

  v1["🚗 Veículo"]
  doc["🪪 CPF/CNPJ"]
  v2["🚗 Veículo"]
  os1["📋 OS"]
  v3["🚗 Veículo"]
  itens["🔧 Serviços e peças"]
  orc1["💰 Orçamento"]
  orc2["💰 Orçamento"]

  cliente -->|"1. entrega"| v1 -->|"ao"| atendente
  atendente -->|"2. identifica o cliente pelo"| doc -->|"no"| sistema
  atendente -->|"3. cadastra"| v2 -->|"no"| sistema
  atendente -->|"4. abre"| os1 -->|"no"| sistema
  mecanico -->|"5. diagnostica"| v3
  mecanico -->|"6. inclui"| itens -->|"na OS, no"| sistema
  sistema -->|"7. calcula"| orc1
  atendente -->|"8. envia"| orc2 -->|"ao"| cliente

  n1["Opcional: consulta o preço na tabela FIPE"]
  v2 -.- n1
  n2["Valores copiados do catálogo"]
  orc1 -.- n2
  n3["O Sistema reserva as peças e envia o e-mail com os links de aprovação"]
  orc2 -.- n3

  classDef ator fill:#dbe4ff,stroke:#364fc7,color:#1c2a6b
  classDef objeto fill:#f1f3f5,stroke:#495057,color:#212529
  classDef nota fill:#fff3bf,stroke:#f08c00,color:#5c3c00,stroke-dasharray:4 3
  class cliente,atendente,mecanico,sistema ator
  class v1,doc,v2,os1,v3,itens,orc1,orc2 objeto
  class n1,n2,n3 nota
```

> **Imagem:** [domain-storytelling-2-abertura-orcamento.png](domain-storytelling-2-abertura-orcamento.png)

## 3. TO BE — Aprovação, pagamento, execução e entrega

1. O **Cliente** aprova o **Orçamento** pelo link do e-mail, no **Sistema**.
2. O **Sistema** baixa as **Peças reservadas** do estoque.
3. O **Cliente** paga a **OS** ao **Atendente**.
4. O **Atendente** confirma o **Pagamento** no **Sistema**.
5. O **Mecânico** inicia a execução da **OS** no **Sistema**.
6. O **Mecânico** executa os serviços no **Veículo**.
7. O **Mecânico** finaliza a **OS** no **Sistema**.
8. O **Sistema** envia o **Aviso de conclusão** ao **Cliente**.
9. O **Atendente** entrega o **Veículo** ao **Cliente**.
10. O **Atendente** registra a entrega da **OS** no **Sistema**.

```mermaid
flowchart LR
  cliente(["👤 Cliente"])
  atendente(["👤 Atendente"])
  mecanico(["👤 Mecânico"])
  sistema(["🖥️ Sistema"])

  orc1["💰 Orçamento"]
  pecas["🔩 Peças reservadas"]
  os1["📋 OS"]
  pag["💳 Pagamento"]
  os2["📋 OS"]
  v1["🚗 Veículo"]
  os3["📋 OS"]
  aviso["✉️ Aviso de conclusão"]
  v2["🚗 Veículo"]
  os4["📋 OS"]

  cliente -->|"1. aprova pelo link do e-mail"| orc1 -->|"no"| sistema
  sistema -->|"2. baixa do estoque"| pecas
  cliente -->|"3. paga"| os1 -->|"ao"| atendente
  atendente -->|"4. confirma"| pag -->|"no"| sistema
  mecanico -->|"5. inicia a execução da"| os2 -->|"no"| sistema
  mecanico -->|"6. executa os serviços no"| v1
  mecanico -->|"7. finaliza"| os3 -->|"no"| sistema
  sistema -->|"8. envia"| aviso -->|"ao"| cliente
  atendente -->|"9. entrega"| v2 -->|"ao"| cliente
  atendente -->|"10. registra a entrega da"| os4 -->|"no"| sistema

  n1["Sem login: o link abre uma página de confirmação"]
  orc1 -.- n1
  n2["Gera uma movimentação de saída vinculada à OS"]
  pecas -.- n2
  n3["Sem a confirmação, a execução não começa"]
  pag -.- n3

  classDef ator fill:#dbe4ff,stroke:#364fc7,color:#1c2a6b
  classDef objeto fill:#f1f3f5,stroke:#495057,color:#212529
  classDef nota fill:#fff3bf,stroke:#f08c00,color:#5c3c00,stroke-dasharray:4 3
  class cliente,atendente,mecanico,sistema ator
  class orc1,pecas,os1,pag,os2,v1,os3,aviso,v2,os4 objeto
  class n1,n2,n3 nota
```

> **Imagem:** [domain-storytelling-3-aprovacao-execucao.png](domain-storytelling-3-aprovacao-execucao.png)

## 4. TO BE — Recusa do orçamento

1. O **Cliente** recusa o **Orçamento** pelo link do e-mail, no **Sistema**.
2. O **Sistema** libera as **Peças reservadas** no estoque.
3. O **Sistema** cancela a **OS**.
4. O **Atendente** devolve o **Veículo** ao **Cliente**.

```mermaid
flowchart LR
  cliente(["👤 Cliente"])
  atendente(["👤 Atendente"])
  sistema(["🖥️ Sistema"])

  orc1["💰 Orçamento"]
  pecas["🔩 Peças reservadas"]
  os1["📋 OS"]
  v1["🚗 Veículo"]

  cliente -->|"1. recusa pelo link do e-mail"| orc1 -->|"no"| sistema
  sistema -->|"2. libera no estoque"| pecas
  sistema -->|"3. cancela"| os1
  atendente -->|"4. devolve"| v1 -->|"ao"| cliente

  n1["Motivo opcional"]
  orc1 -.- n1
  n2["Voltam a ficar disponíveis para outros orçamentos"]
  pecas -.- n2
  n3["OS cancelada é um status final"]
  os1 -.- n3

  classDef ator fill:#dbe4ff,stroke:#364fc7,color:#1c2a6b
  classDef objeto fill:#f1f3f5,stroke:#495057,color:#212529
  classDef nota fill:#fff3bf,stroke:#f08c00,color:#5c3c00,stroke-dasharray:4 3
  class cliente,atendente,sistema ator
  class orc1,pecas,os1,v1 objeto
  class n1,n2,n3 nota
```

> **Imagem:** [domain-storytelling-4-recusa.png](domain-storytelling-4-recusa.png)

## Relação com o restante da documentação

| Na história | No domínio | Onde |
|---|---|---|
| Atendente, Mecânico | Papel `staff` | [C4 — Nível 1](../c4/01-system-context.md#pessoas) |
| Cliente | Papel `client` | [C4 — Nível 1](../c4/01-system-context.md#pessoas) |
| OS, Orçamento, Serviços e peças | Agregado Ordem de Serviço e seus itens | [Modelo de Domínio](modelo-de-dominio.md#3-agregados) |
| Peças reservadas | Agregado Estoque (reserva, baixa e liberação) | [ADR-010](../adr/adr-010-reserva-estoque-orcamento.md) |
| Veículo, CPF/CNPJ | Agregados Veículo e Usuário; objetos de valor `Cpf` e `Cnpj` | [Modelo de Domínio](modelo-de-dominio.md#5-objetos-de-valor) |
| Link do e-mail, Aviso de conclusão | Política de notificação (`WorkOrderNotificationHandler`) | [Eventos de Domínio](eventos-de-dominio.md#reações-a-eventos) |
| Atividades numeradas | Comandos e eventos do Event Storming | [Event Storming](README.md#event-storming) |

Os termos usados nas histórias seguem a [Linguagem Ubíqua](linguagem-ubiqua.md).
