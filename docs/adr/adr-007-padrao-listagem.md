# ADR-007 — Padrão de Listagem: Paginação, Busca, Ordenação e Filtros

- **Status:** Aprovado
- **Data:** 05/10/2026
- **Autor:** Michel Lisboa
- **Revisores:** Felipe Santana, Julio Cavalcanti, Kevin Villanova, Matheus Andrell

## Contexto

A API possui diversas rotas de listagem (usuários, veículos, produtos, reparos, estoque, movimentações de estoque e ordens de serviço). Sem um padrão, cada rota tenderia a implementar paginação, busca e filtros de forma diferente, com nomes de parâmetros e formatos de resposta distintos.

Também era necessário evitar que uma listagem retornasse todos os registros de uma vez, o que se tornaria um problema à medida que os dados crescessem.

## Decisão

Adotar um **contrato único de listagem** para todas as rotas, baseado em um DTO comum (`PaginationQueryDto`) e em um formato de resposta padronizado.

### Parâmetros de consulta

| Parâmetro | Descrição | Padrão |
|---|---|---|
| `page` | Número da página, a partir de 1 | 1 |
| `limit` | Itens por página, no máximo 100 | 10 |
| `search` | Busca textual nas colunas definidas por cada recurso | — |
| `sort` | JSON com a ordenação, por exemplo `[{"field":"createdAt","order":"desc"}]` | — |
| `filters` | JSON com os filtros, por exemplo `{"productType":"PART"}` | — |

- A paginação é por **página e limite** (*offset*).
- A busca textual divide o termo em palavras e procura cada uma, sem diferenciar maiúsculas e minúsculas, nas colunas configuradas para o recurso.
- A ordenação só aceita os campos permitidos por cada recurso. Campos não permitidos são ignorados.
- Cada recurso define e valida os filtros que aceita. Algumas rotas também aceitam atalhos em parâmetros simples, como `status` na listagem de ordens de serviço.

### Formato da resposta

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 10, "totalItems": 47, "totalPages": 5 }
}
```

### Implementação

- O DTO de cada listagem estende o `PaginationQueryDto`, herdando a validação dos parâmetros comuns.
- Os repositórios recebem uma `PaginationQuery` e devolvem um `PaginatedOutput`, tipos que não dependem de banco de dados.
- A tradução para consultas SQL é feita por um helper comum aos repositórios TypeORM.

## Alternativas consideradas

### Filtros em parâmetros simples para cada campo

Cada filtro seria um parâmetro próprio na URL, por exemplo `?status=approved&productType=PART`.

É um formato mais comum e legível, mas cada novo filtro exigiria alterar o DTO e a documentação da rota, e os filtros se misturariam aos parâmetros de paginação. O formato JSON permite um contrato estável e documentado da mesma forma no Swagger para todas as rotas.

**Decisão:** Não adotado como padrão. Mantido apenas como atalho em rotas específicas.

### Paginação por cursor

A paginação usaria um cursor que aponta para o último registro retornado, em vez do número da página.

É mais eficiente em tabelas muito grandes e estável quando há inserções durante a navegação, mas não permite saltar para uma página específica nem informar o total de páginas, recursos úteis para as telas de gestão da oficina. O volume de dados esperado não justifica essa complexidade.

**Decisão:** Não adotado.

## Consequências

### Positivas

- Todas as listagens têm o mesmo comportamento e o mesmo formato de resposta
- O limite máximo de 100 itens por página evita respostas excessivamente grandes
- A lista de campos permitidos na ordenação impede ordenar por colunas não previstas
- Os metadados da paginação permitem montar links de navegação entre páginas (ver ADR-009)

### Negativas

- Os parâmetros `sort` e `filters` em JSON precisam ser codificados na URL, o que os torna menos legíveis e menos práticos de digitar manualmente
- Cada recurso ainda precisa configurar e validar seus filtros e as colunas de busca e de ordenação
- A paginação por *offset* perde desempenho em páginas muito distantes de tabelas grandes
- A busca textual por `ILIKE` não utiliza índices comuns e depende do PostgreSQL
