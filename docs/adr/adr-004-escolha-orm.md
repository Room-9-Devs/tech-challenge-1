# ADR-004 — Escolha do ORM da Aplicação

- **Status:** Aprovado
- **Data:** 22/09/2026
- **Autor:** Kevin Villanova
- **Revisores:** Felipe Santana, Julio Cavalcanti, Matheus Andrell, Michel Lisboa

## Contexto

A solução a ser desenvolvida tem como cliente uma oficina mecânica para carros.

Foi solicitada uma API RESTful monolítica para gestão de clientes, veículos, serviços, peças e ordens de serviço.

Considerando a utilização de **NestJS + TypeScript**, **PostgreSQL** e **Clean Architecture**, foi necessária a escolha de um ORM para implementação da camada de persistência.

Para tal objetivo, foram avaliadas três alternativas:

- TypeORM
- Prisma
- Sequelize

## Decisão

Adotar o **TypeORM** como ORM do projeto.

A escolha foi baseada na familiaridade da equipe com a ferramenta, na integração com o ecossistema NestJS e na utilização de entidades TypeScript para o mapeamento dos modelos.

O TypeORM será utilizado na camada de infraestrutura, mantendo os detalhes de persistência isolados das regras de negócio.

## Alternativas consideradas

### Prisma

O Prisma utiliza um schema próprio (`schema.prisma`) para definição dos modelos, mantendo a modelagem do banco isolada do restante do código da aplicação.

Essa separação foi considerada positiva pela equipe, porém a ferramenta também introduz muitos arquivos com extensão `.prisma` e necessita de diversas configurações próprias para seu funcionamento.

A equipe optou por não utilizá-lo por considerar que essa estrutura adicional poluiria bastante o projeto e preferir uma abordagem mais integrada ao próprio TypeScript.

**Decisão:** Não adotado.

### Sequelize

O Sequelize é uma solução consolidada para aplicações Node.js e possui suporte a TypeScript e PostgreSQL.

Entretanto, o estilo de modelagem e utilização da ferramenta não agradou à equipe, sendo considerado menos adequado ao padrão de desenvolvimento adotado no projeto.

**Decisão:** Não adotado.

## Consequências

A aplicação usará o TypeORM de forma isolada para gerir o banco de dados, sem que as demais camadas tomem conhecimento de sua utilização.

### Positivas

- Integração nativa com o NestJS por meio do módulo `@nestjs/typeorm`
- Mapeamento dos modelos feito em TypeScript, sem arquivos de schema externos
- Versionamento do esquema do banco por meio de migrations, executadas automaticamente na inicialização da aplicação
- Uma eventual troca de ORM ficaria restrita à camada de infraestrutura

### Negativas

- Necessidade de manter entidades de domínio e entidades de persistência separadas, com mappers entre elas
- Duplicação de estrutura entre os dois modelos, o que exige atenção ao alterar campos
- Necessidade de gerar e revisar uma migration a cada alteração no modelo de dados