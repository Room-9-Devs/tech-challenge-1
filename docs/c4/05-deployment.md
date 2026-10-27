# C4 — Diagrama de Implantação (Deployment)

Diagrama complementar do C4: mostra **onde** os containers do [Nível 2](02-container.md) são executados — nós de infraestrutura, imagens, portas, volumes e redes.

> **Ambiente representado.** O sistema é executado localmente via Docker Compose, para desenvolvimento e avaliação. Não há ambiente de produção nem deploy em nuvem (ver o escopo excluído no [DAS](../das/das-001-sistema-gestao-oficina.md#22-escopo-excluído)). O diagrama também mostra o GitHub Actions, onde roda a análise de vulnerabilidades.

```mermaid
C4Deployment
  title Diagrama de Implantação — Ambiente local (Docker Compose)

  Person(usuario, "Usuário", "Colaborador, cliente ou avaliador, pelo navegador, Swagger ou Postman.")

  Deployment_Node(internet, "Internet", "Serviços externos") {
    System_Ext(resend, "Resend", "E-mails transacionais.")
    System_Ext(fipe, "FIPE (Parallelum)", "Preços de veículos.")
  }

  Deployment_Node(maquina, "Máquina local", "Docker Engine / Docker Desktop") {
    Deployment_Node(compose, "Docker Compose", "Rede app-network (bridge)") {
      Deployment_Node(c_backend, "backend", "Container: node:24-alpine") {
        Container(api, "API", "NestJS 11, Node.js 24", "Porta 3000. Executa como usuário node, em modo watch, com o código montado de ./backend.")
      }
      Deployment_Node(c_postgres, "postgres", "Container: postgres:18-alpine") {
        ContainerDb(db, "Banco de Dados", "PostgreSQL 18", "Porta 5432. Volume postgres_data. Healthcheck pg_isready.")
      }
      Deployment_Node(c_adminer, "adminer", "Container: adminer:latest") {
        Container(adminer, "Adminer", "Interface web", "Porta 8080. Consulta ao banco.")
      }
      Deployment_Node(c_sonar, "Profile sonar", "Containers opcionais") {
        Container(sonar, "SonarQube", "Community 26.9", "Porta 9000. Análise estática.")
        ContainerDb(sonardb, "sonar-db", "PostgreSQL 18", "Volume sonar_db_data. Sem porta no host.")
      }
    }
  }

  Deployment_Node(github, "GitHub Actions", "Runner ubuntu-latest") {
    Container(trivy, "Trivy Security Scan", "Trivy v0.76.0", "Build da imagem do backend e análise do repositório e da imagem.")
  }

  Rel(usuario, api, "Usa a API", "HTTP :3000")
  Rel(api, db, "Lê e grava", "TypeORM, TCP 5432")
  Rel(adminer, db, "Consulta", "TCP 5432")
  Rel(sonar, sonardb, "Lê e grava", "JDBC")
  Rel(api, resend, "Envia e-mails", "HTTPS")
  Rel(api, fipe, "Consulta preços", "HTTPS")

  UpdateRelStyle(usuario, api, $textColor="#6e7681", $offsetX="-10", $offsetY="-80")
  UpdateRelStyle(api, db, $textColor="#6e7681", $offsetX="-70", $offsetY="-45")
  UpdateRelStyle(adminer, db, $textColor="#6e7681")
  UpdateRelStyle(sonar, sonardb, $textColor="#6e7681")
  UpdateRelStyle(api, resend, $textColor="#6e7681", $offsetY="-20")
  UpdateRelStyle(api, fipe, $textColor="#6e7681", $offsetY="15")
  UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="2")
```

> **Imagem:** [05-deployment.png](05-deployment.png), com fundo branco.

## Elementos

### Máquina local (Docker Compose)

Definida em [docker-compose.yml](../../docker-compose.yml). Todos os containers ficam na rede `app-network` (driver `bridge`) e se comunicam pelo nome do serviço (ex.: a API acessa o banco em `postgres:5432`).

| Container | Imagem | Porta no host | Volumes | Observações |
|---|---|---|---|---|
| `backend` | Build de [backend/Dockerfile](../../backend/Dockerfile), sobre `node:24-alpine` | 3000 | `./backend:/app` (código) e volume anônimo em `/app/node_modules` | Executa como usuário `node`, com `npm run start:dev` (watch). Variáveis lidas de `backend/.env`; `DATABASE_HOST=postgres`. Só sobe depois que o `postgres` está saudável. |
| `postgres` | `postgres:18-alpine` | 5432 | `postgres_data` | Usuário, senha e banco vêm de `backend/.env`. Healthcheck com `pg_isready` a cada 5 s. |
| `adminer` | `adminer:latest` | 8080 | — | Ferramenta de apoio para consultar o banco; servidor padrão `postgres`. Reinicia sempre (`restart: always`). |
| `sonarqube` | `sonarqube:26.9.0.129388-community` | 9000 | `sonarqube_data`, `sonarqube_extensions`, `sonarqube_logs` | Só sobe com `docker compose --profile sonar up -d`. Depende do `sonar-db` saudável. |
| `sonar-db` | `postgres:18-alpine` | — | `sonar_db_data` | Banco exclusivo do SonarQube, acessível apenas pela rede interna. Só sobe com o profile `sonar`. |

Os containers `backend` e `postgres` usam o fuso `America/Sao_Paulo`, inclusive no `now()` do banco.

`backend` e `postgres` formam a solução; `adminer`, `sonarqube` e `sonar-db` são ferramentas de apoio ao desenvolvimento.

### GitHub Actions

| Job | Ambiente | O que faz |
|---|---|---|
| `repository` | `ubuntu-latest` | Trivy sobre o repositório: dependências (`package-lock.json`), *secrets* e configuração do `Dockerfile`. |
| `image` | `ubuntu-latest` | Build da imagem do backend (`docker build ./backend`) e Trivy sobre a imagem (SO e pacotes Node.js). |

Definido em [.github/workflows/trivy.yml](../../.github/workflows/trivy.yml). Executa em todo *pull request*, em push para `main` e `develop`, semanalmente e sob demanda, com as *actions* fixadas por SHA ([ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md)).

### Serviços externos

| Sistema | Acesso | Configuração |
|---|---|---|
| **Resend** | HTTPS, a partir do container `backend` | `RESEND_API_KEY` e `EMAIL_FROM`; sem chave, a API não envia e-mails |
| **FIPE (Parallelum)** | HTTPS, a partir do container `backend` | `FIPE_API_TOKEN` opcional; sem ele, vale a cota pública |

## Referências

- [C4 — Nível 2: Diagrama de Containers](02-container.md)
- [ADR-013 — Análise Estática de Código com SonarQube](../adr/adr-013-analise-estatica-sonarqube.md)
- [ADR-014 — Análise de Vulnerabilidades com Trivy](../adr/adr-014-analise-vulnerabilidades-trivy.md)
- [Relatório — Análise de Vulnerabilidades com Trivy](../reports/analise-vulnerabilidades-trivy.md)
