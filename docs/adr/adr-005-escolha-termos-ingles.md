# ADR-005 — Escolha de Termo em Inglês para Serviço

- **Status:** Aprovado
- **Data:** 02/10/2026
- **Autor:** Kevin Villanova
- **Revisores:** Felipe Santana, Julio Cavalcanti, Matheus Andrell, Michel Lisboa

## Contexto

A solução a ser desenvolvida tem como cliente uma oficina mecânica para carros, então os serviços mecânicos são uma das entidades principais dentro desse domínio.

Só que o termo **Service** traz conflitos em nosso projeto porque é um termo que tem alguns usos dentro do mundo da programação, criando situações em que não saberíamos se é uma camada de serviço ou se é a entidade, e criando nomes de classe muito esquisitos como ServiceService.

## Decisão

Adotar o termo **Repair** como tradução para Serviço.

Sabemos que o termo não é uma correspondência exata quanto à tradução, mas é um termo que não possui nenhum uso técnico dentro do projeto, como tem Service, ou como teria termos como fix, job, entre outros, então funcionaria muito bem dentro do nosso dicionário de linguagem ubíqua para a língua inglesa.

## Alternativas consideradas

### ServiceType

O termo ServiceType chegou a ser usado durante um tempo para cobrir o espaço.

Mas o sufixo Type dá a errônea ideia de ser uma taxonomia, dando uma ideia que poderia ser uma classificação ou entidade secundária/de apoio para uma entidade principal chamada Service, que nesse caso nem existiria.

Além que continuaria criando termos estranhos como ServiceTypeService.

**Decisão:** Não adotado.

## Consequências

A aplicação usará o termo Repair para se referir a um Serviço da oficina mecânica, e Repairs para o conjunto dos Serviços.
