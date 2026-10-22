# ADR-002 — Escolha do Banco de Dados Principal

- **Status:** Aprovado
- **Data:** 22/09/2026
- **Autor:** Kevin Villanova
- **Revisores:** Felipe Santana, Julio Cavalcanti, Matheus Andrell, Michel Lisboa

## Contexto

A solução a ser desenvolvida tem como cliente uma oficina mecânica para carros.

O sistema precisa persistir informações relacionadas a clientes, veículos, ordens de serviço, serviços, peças e estoque, além de garantir a consistência dos dados durante as principais operações do sistema.

Foram consideradas duas abordagens principais para a persistência dos dados: bancos de dados relacionais e não relacionais, com destaque para PostgreSQL, MySQL/MariaDB e soluções NoSQL. Só avaliamos ferramentas gratuitas.

## Decisão

Adotar o **PostgreSQL como banco de dados principal** da aplicação.

A escolha se deve principalmente à natureza do domínio, que possui relacionamentos bem definidos entre suas entidades e exige consistência e integridade dos dados.

Além disso, o PostgreSQL atende aos requisitos de persistência e transações do projeto e possui boa integração com a stack que foi definida na ADR-001.

A familiaridade da equipe com PostgreSQL também reduz a curva de aprendizado e facilita o desenvolvimento e a manutenção da solução.

## Alternativas

### Bancos de dados NoSQL

Foram considerados como alternativa, porém não foram adotados como banco principal.

O domínio possui relacionamentos e regras de integridade bem definidos, tornando o modelo relacional mais adequado às necessidades do sistema.

Essa decisão não impede a utilização futura de outras tecnologias de persistência para necessidades específicas, como cache ou armazenamento especializado.

### MySQL / MariaDB

São alternativas relacionais tecnicamente adequadas ao projeto e atenderiam aos requisitos de persistência.

Entretanto, não apresentam uma necessidade específica que justifique sua escolha em relação ao PostgreSQL, considerando também a maior familiaridade da equipe com PostgreSQL.

## Consequências

- PostgreSQL será utilizado como fonte principal de persistência da aplicação.
- O modelo de dados poderá utilizar os recursos relacionais e transacionais do PostgreSQL.
- A equipe poderá aproveitar conhecimento prévio da tecnologia.
- Outras tecnologias de armazenamento poderão ser adicionadas futuramente para necessidades específicas, sem substituir o PostgreSQL como banco principal.