# Modelo C4

Diagramas de arquitetura do **Sistema de Gestão da Oficina Mecânica** no [modelo C4](https://c4model.com/). O modelo descreve o software em níveis de zoom: cada nível detalha um elemento do nível anterior, do sistema visto de fora até as classes de um componente.

## Níveis

| Nível | Documento | Imagem | O que mostra |
|---|---|---|---|
| 1 — Contexto | [01-system-context.md](01-system-context.md) | [PNG](01-system-context.png) | O sistema, as pessoas que o usam (Cliente, Atendente, Mecânico, Administrador) e os sistemas externos (Resend e FIPE). |
| 2 — Containers | [02-container.md](02-container.md) | [PNG](02-container.png) | As unidades executáveis: a API (NestJS) e o banco (PostgreSQL), com as tecnologias, a comunicação e a execução via Docker Compose. |
| 3 — Componentes | [03-component.md](03-component.md) | [PNG](03-component.png) | Os componentes da API por bounded context, as regras de acesso por papel, os eventos de domínio e as transações. |
| 4 — Código | [04-code.md](04-code.md) | [Agregado](04-code-agregado.png) · [Mudança de status](04-code-mudanca-status.png) | As classes do componente Ordem de Serviço: o agregado e o fluxo de mudança de status, do controller ao banco e ao e-mail. |

A ordem de leitura recomendada é do nível 1 ao 4. Cada documento traz a explicação dos elementos e as referências para os ADRs e para a documentação DDD.

> **Nível 4 parcial.** No modelo C4, o nível de código é opcional e recomendado só para os componentes mais importantes, porque muda junto com o código. Por isso ele cobre apenas a **Ordem de Serviço**, o domínio principal do sistema.

## Notação

| Nível | Sintaxe Mermaid | Observação |
|---|---|---|
| 1 e 2 | `C4Context` / `C4Container` | Sintaxe C4 nativa do Mermaid, com posicionamento ajustado por `UpdateRelStyle`. |
| 3 | `flowchart` com as cores do C4 | Com muitas relações, o `C4Component` gera sobreposições; o `flowchart` organiza o layout automaticamente. |
| 4 | `classDiagram` (UML) | Estereótipos `<<Aggregate Root>>`, `<<Entity>>`, `<<port>>` etc. identificam o papel de cada classe. |

Os diagramas ficam em blocos Mermaid dentro dos `.md`, renderizados pelo próprio GitHub. Os PNGs são exportações desses blocos, para consulta fora do GitHub e para a entrega.

## Atualizar os diagramas

O `.md` é a fonte: depois de alterar um diagrama, gere o PNG de novo para os dois continuarem iguais. Os PNGs foram gerados com o [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli):

```bash
cd docs/c4
npx -y @mermaid-js/mermaid-cli@11.4.2 -i 01-system-context.md -o 01-system-context.png -w 1050 -s 2 -b white
```

- Num `.md`, o CLI exporta cada bloco Mermaid com um sufixo numérico (`01-system-context-1.png`); renomeie para o nome final.
- **Nível 3 e diagrama de mudança de status do nível 4:** os PNGs usam o layout **ELK**, que organiza melhor diagramas com muitas setas. Para gerá-los, copie o bloco Mermaid para um arquivo `.mmd` com este cabeçalho e exporte esse arquivo:

  ```yaml
  ---
  title: Diagrama de Componentes — API
  config:
    layout: elk
  ---
  ```

  No GitHub, os mesmos diagramas aparecem com o layout padrão.

## Documentação relacionada

- [ADRs — decisões de arquitetura](../adr/README.md)
- [Documentação DDD](../ddd/README.md): Event Storming, Linguagem Ubíqua, Glossário e relação com o código
- [Modelo de Dados](../database/README.md): DER conceitual e físico
