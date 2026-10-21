# ADR-013 — Análise Estática de Código com SonarQube

- **Status:** Aprovado
- **Data:** 18/10/2026
- **Autor:** Felipe Santana
- **Revisores:** Julio Cavalcanti, Kevin Villanova, Matheus Andrell, Michel Lisboa

## Contexto

O projeto precisa seguir boas práticas de qualidade de software e comprovar a cobertura mínima de 80% de testes nos domínios críticos.

O ESLint e o Prettier já verificam padrões de escrita e formatação, e o Jest gera o relatório de cobertura. Porém, essas ferramentas não oferecem uma visão consolidada da qualidade do código, como *bugs* prováveis, *code smells*, duplicação, pontos sensíveis de segurança e a cobertura por arquivo ao longo do tempo.

## Decisão

Adotar o **SonarQube Community Edition**, executado localmente via Docker, para a análise estática do backend.

### Execução

- O SonarQube e o seu banco de dados (PostgreSQL) estão no `docker-compose.yml`, no perfil `sonar`. Assim, só sobem quando solicitados (`docker compose --profile sonar up -d sonarqube`) e não pesam no ambiente do dia a dia.
- A análise é feita pelo `sonarqube-scanner`, com o comando `npm run sonar`, a partir da pasta `backend`.
- O token de acesso é informado pela variável de ambiente `SONAR_TOKEN` e nunca é versionado.

### Escopo da análise

- A configuração fica em `backend/sonar-project.properties`.
- São analisados o código de `src` e os testes de `test`.
- A cobertura é lida do relatório `lcov` gerado pelo Jest.
- As migrations ficam fora da análise. O *bootstrap*, os módulos do NestJS, os *seeds* e os scripts de banco ficam fora do cálculo de cobertura, por não conterem regra de negócio.

## Alternativas consideradas

### Apenas ESLint e relatório de cobertura do Jest

Manter somente as ferramentas já utilizadas no projeto.

Não exigiria nenhuma infraestrutura adicional, mas não ofereceria a visão consolidada de *bugs*, duplicação, pontos sensíveis de segurança e cobertura por arquivo.

**Decisão:** Não adotado.

### SonarCloud

Versão do SonarQube oferecida como serviço, integrada ao GitHub e gratuita para repositórios públicos.

Dispensaria a execução local e poderia comentar diretamente nos *pull requests*, mas exigiria vincular a organização do GitHub a um serviço externo. A versão local permite que qualquer integrante rode a análise sem depender dessa configuração.

**Decisão:** Não adotado.

## Consequências

### Positivas

- Visão consolidada da qualidade do código, incluindo *bugs*, *code smells*, duplicação e pontos sensíveis de segurança
- Acompanhamento da cobertura de testes por arquivo
- Ferramenta gratuita e executada localmente, sem depender de serviços externos
- O perfil `sonar` mantém o ambiente principal leve

### Negativas

- A análise não é executada automaticamente no CI: depende de cada integrante rodá-la manualmente, e nenhum *quality gate* bloqueia *pull requests*
- O SonarQube exige memória considerável e um segundo banco PostgreSQL para funcionar
- A primeira execução exige configuração manual, como a troca da senha inicial e a geração do token
- Os resultados ficam apenas na instância local de quem executou a análise
