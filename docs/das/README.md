# Design Approval Sheets (DAS)

Documentos de aprovação do design do **Sistema de Gestão da Oficina Mecânica**. Cada DAS reúne, em um só lugar, o objetivo e o escopo da solução, as tecnologias, os requisitos, a arquitetura, os diagramas, os riscos e o checklist de qualidade, apontando para os documentos de detalhe.

| DAS | Solução | Versão | Data |
|---|---|---|---|
| [DAS-001](das-001-sistema-gestao-oficina.md) | Sistema de Gestão da Oficina Mecânica — back-end (MVP) | 1.0 | 27/10/2026 |

## DAS e ADR

| | DAS | ADR |
|---|---|---|
| **O que registra** | O design da solução como um todo | Uma decisão de arquitetura |
| **Ciclo de vida** | Documento vivo: é atualizado e ganha uma nova versão a cada mudança | Documento final: uma mudança gera um novo ADR |
| **Relação** | Lista os ADRs na seção de arquitetura | É referenciado pelo DAS |

## Atualizar um DAS

1. Altere as seções afetadas e registre a mudança na tabela **Versão** do próprio DAS (ex.: `1.1`, com a data e a descrição).
2. Atualize a versão e a data na tabela acima.
3. Se a mudança envolver uma nova decisão de arquitetura, registre-a primeiro em um [ADR](../adr/README.md) e referencie-o no DAS.
4. Se alterar o diagrama de sequência, gere o PNG de novo a partir do bloco Mermaid, como descrito em [Atualizar os diagramas](../c4/README.md#atualizar-os-diagramas).

## Novo DAS

1. Copie a estrutura do DAS-001: identificação (título, autores, data, versão e identificador), objetivo, escopo, tecnologias, requisitos, arquitetura, diagramas, padrões, riscos e mitigações e checklist de qualidade.
2. Use o próximo número livre no nome do arquivo: `das-NNN-titulo-curto.md`.
3. Inclua o DAS na tabela acima.
