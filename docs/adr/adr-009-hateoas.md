# ADR-009 — Adoção de HATEOAS nas Respostas da API

- **Status:** Aprovado
- **Data:** 09/10/2026
- **Atualização:** 18/10/2026 — padrão estendido às ordens de serviço
- **Autor:** Felipe Santana
- **Revisores:** Julio Cavalcanti, Kevin Villanova, Matheus Andrell, Michel Lisboa

## Contexto

A API é RESTful e atende perfis com permissões diferentes (`admin`, `staff` e `client`). Além disso, várias entidades possuem um ciclo de vida com regras próprias. A principal delas é a ordem de serviço (OS), cujas ações possíveis dependem do status atual: um orçamento só pode ser aprovado enquanto a OS aguarda aprovação, e itens só podem ser adicionados antes do envio do orçamento.

Sem informações sobre as ações disponíveis, o consumidor da API precisa conhecer e replicar essas regras para saber o que pode fazer com cada recurso, o que duplica a lógica e aumenta o risco de chamadas inválidas.

## Decisão

Adotar **HATEOAS** (*Hypermedia as the Engine of Application State*): as respostas incluem um campo `_links` com as ações disponíveis para o recurso, cada uma com `href` e `method`.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Troca de óleo",
  "_links": {
    "self": { "href": "/repairs/550e8400-...", "method": "GET" },
    "update": { "href": "/repairs/550e8400-...", "method": "PUT" },
    "delete": { "href": "/repairs/550e8400-...", "method": "DELETE" }
  }
}
```

### Regras dos links

- **Variam com o perfil:** um cliente recebe apenas os links das ações que pode executar.
- **Variam com o estado:** um produto inativo não expõe `delete`. Na OS, aparecem apenas as próximas ações válidas do fluxo de status, como `send-quote` (somente quando a OS possui itens) e `approve`/`reject` (somente enquanto aguarda aprovação e para a equipe ou para o cliente dono da OS).
- **Relacionamentos:** os recursos apontam para os recursos relacionados, como o dono do veículo, o estoque do produto e o histórico de eventos da entidade (ADR-008).
- **Coleções paginadas** recebem `self`, `first`, `prev`, `next` e `last`, preservando a busca, a ordenação e os filtros da requisição (ADR-007).
- **Listas sem paginação** continuam sendo arrays, e apenas os itens recebem `_links`, para não alterar o formato da resposta.

### Implementação

- A implementação é própria e fica inteiramente na camada HTTP (`infrastructure/http/hateoas`), conforme a ADR-003. O domínio e os casos de uso não conhecem os links.
- Cada recurso possui um *builder* de links, aplicado às rotas pelos decorators `@HateoasItem(...)` e `@HateoasCollection(...)` e executado por um interceptor sobre a resposta do controller.

## Alternativas consideradas

### API sem hipermídia

As respostas conteriam apenas os dados, e o consumidor montaria as URLs e decidiria as ações com base na documentação.

É a abordagem mais simples, mas obriga o consumidor a replicar as regras de permissão e de fluxo de status, principalmente no caso das ordens de serviço.

**Decisão:** Não adotado.

### Formatos padronizados de hipermídia (HAL, JSON:API)

Formatos com especificação pública e bibliotecas prontas para geração e consumo dos links.

Exigiriam alterar a estrutura das respostas já existentes (por exemplo, o JSON:API encapsula os dados em `data.attributes`) e trazem convenções além do necessário para o projeto. O formato próprio adiciona apenas o campo `_links`, inspirado no HAL, e mantém o restante da resposta inalterado.

**Decisão:** Não adotado.

## Consequências

### Positivas

- O consumidor descobre as ações disponíveis sem replicar as regras de permissão e de fluxo de status
- A API atinge o nível 3 do modelo de maturidade de Richardson
- A navegação entre páginas e entre recursos relacionados fica explícita nas respostas
- A adição de links não altera o domínio, os casos de uso nem a estrutura dos dados já retornados

### Negativas

- As regras que definem os links, como o fluxo de status da OS e as permissões, ficam duplicadas na camada HTTP e precisam acompanhar as mudanças do domínio
- O formato próprio não é reconhecido por ferramentas e bibliotecas de clientes que trabalham com HAL ou JSON:API
- As respostas ficam maiores
- Cada novo recurso exige a criação do seu *builder* de links
