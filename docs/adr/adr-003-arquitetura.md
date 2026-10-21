# ADR-003 — Escolha da Arquitetura da Aplicação

- **Status:** Aprovado
- **Data:** 22/09/2026
- **Autor:** Kevin Villanova
- **Revisores:** Felipe Santana, Julio Cavalcanti, Matheus Andrell, Michel Lisboa

## Contexto

A aplicação será desenvolvida como uma API RESTful monolítica para gerenciamento de uma oficina mecânica, contemplando funcionalidades relacionadas a clientes, veículos, serviços, peças e ordens de serviço.

O projeto possui como requisito a utilização de princípios de **Domain-Driven Design (DDD)** na modelagem e organização do projeto.

Dessa forma, foram avaliadas abordagens arquiteturais com boa aderência à aplicação de DDD:

- Clean Architecture
- Onion Architecture
- Hexagonal Architecture

## Decisão

Adotar a **Clean Architecture** como abordagem arquitetural do projeto.

A escolha foi baseada principalmente na familiaridade da equipe com o padrão e na sua adequação aos requisitos do projeto e à aplicação de DDD.

A organização proposta pela Clean Architecture permite separar claramente **domínio, casos de uso e infraestrutura**, fornecendo uma estrutura familiar à equipe sem exigir uma abordagem excessivamente rígida para a organização do código.

Seguindo o princípio de inversão de dependência da Clean Architecture, as camadas de domínio e de aplicação definem interfaces (*ports*) para repositórios e serviços externos — como persistência, envio de e-mail, geração de tokens e consulta à tabela FIPE —, que são implementadas na camada de infraestrutura. Dessa forma, as regras de negócio não dependem de frameworks, banco de dados ou serviços de terceiros.

## Alternativas consideradas

### Onion Architecture

A Onion Architecture apresenta forte aderência aos princípios de DDD, colocando o domínio no centro da aplicação e mantendo as dependências direcionadas para dentro.

Foi considerada uma alternativa adequada ao projeto, porém a equipe sentiu maior familiaridade com a organização proposta pela Clean Architecture, especialmente na separação entre **entidades, casos de uso e infraestrutura**.

Por esse motivo, foi descartada em favor da Clean Architecture.

### Hexagonal Architecture

A Hexagonal Architecture também apresenta boa aderência ao DDD e compartilha com a Clean Architecture a ideia de isolar o núcleo da aplicação por meio de interfaces.

Entretanto, ela organiza todo o projeto em torno de *ports* e *adapters* de entrada e de saída, sem definir uma separação explícita entre entidades de domínio e casos de uso. A equipe preferiu a estrutura em camadas da Clean Architecture, mais familiar e com papéis mais bem definidos para cada parte do código.

Por esse motivo, foi descartada como modelo de organização do projeto, embora o conceito de *ports* seja utilizado pontualmente, conforme descrito na decisão.

## Consequências

### Positivas

- Boa separação entre domínio, aplicação e infraestrutura
- Estrutura familiar para a equipe
- Facilita a aplicação dos princípios de DDD
- Maior isolamento das regras de negócio
- Facilita a realização de testes unitários
- Reduz o acoplamento com frameworks e tecnologias externas

### Negativas

- Maior quantidade de camadas e abstrações
- Necessidade de criar interfaces e implementações separadas para repositórios e serviços externos
- Pode gerar complexidade desnecessária em funcionalidades simples
- Exige disciplina da equipe para manter a separação entre as camadas