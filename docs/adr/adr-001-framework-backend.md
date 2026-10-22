# ADR-001 — Escolha do Framework do Backend

- **Status:** Aprovado
- **Data:** 22/09/2026
- **Autor:** Kevin Villanova
- **Revisores:** Felipe Santana, Julio Cavalcanti, Matheus Andrell, Michel Lisboa

## Contexto

A solução a ser desenvolvida tem como cliente uma oficina mecânica para carros.
Foi solicitada uma API RESTful monolítica para gestão de clientes, veículos, serviços, peças e ordens de serviço.

Para tal objetivo, foram avaliadas três alternativas de tecnologias para implementação do backend:

- NestJS + TypeScript
- Express (Node.js + TypeScript)
- Laravel

## Decisão

Adotar o **NestJS + TypeScript** como framework do projeto.

Os membros do time já tinham familiaridade com TypeScript e Node.js, reduzindo a curva de aprendizado, sendo necessário apenas o aprendizado das particularidades do framework.

Além disso, o framework NestJS já fornece uma estrutura *out-of-the-box* que facilita a construção de APIs e a organização da aplicação, favorecendo a adoção de boas práticas de arquitetura orientada ao domínio.

## Alternativas consideradas

### Express + TypeScript

O Express é uma solução minimalista para construção de aplicações HTTP em Node.js, oferecendo principalmente roteamento e middleware.

Por ser minimalista, deixa mais decisões de estruturação da aplicação a cargo do time.

Além disso, o NestJS utiliza o Express como HTTP adapter padrão.

**Decisão:** Não adotado.

### Laravel + PHP

O Laravel oferece uma estrutura completa para desenvolvimento de APIs e possui recursos equivalentes aos necessários para o projeto, como Dependency Injection, middleware, validação, autenticação e persistência.

Entretanto, sua adoção exigiria a utilização de PHP e de uma stack diferente daquela com a qual o time possui maior familiaridade.

Considerando que o projeto não apresenta uma necessidade específica que justifique a mudança de stack, optou-se pela utilização de TypeScript e Node.js.

**Decisão:** Não adotado.

## Consequências

- O backend será desenvolvido em TypeScript utilizando NestJS.
- O Express será utilizado como HTTP adapter padrão do NestJS.
- O time poderá aproveitar seu conhecimento existente em TypeScript e Node.js.