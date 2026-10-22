# Relatório — Cobertura dos Testes Automatizados

**Data:** 22/10/2026 

Evidência da cobertura dos testes unitários do backend, com foco na meta de **80% nos domínios críticos** definida no [ADR-013](../adr/adr-013-analise-estatica-sonarqube.md).

---

## 1. Como foi gerado

Execução local, a partir de `backend/`, com o mesmo comando usado para alimentar o SonarQube:

```bash
npm run test:cov:unit
```

| Item | Valor |
|---|---|
| Ambiente | Windows 11, Node.js v24.19.0, Jest 29.7 (`ts-jest`) |
| Escopo | Testes unitários (`test/unit`), com fakes em memória, sem banco nem rede |
| Relatório | `backend/coverage/` (`lcov.info` lido pelo SonarQube e HTML em `lcov-report/`) |
| Exclusões | As mesmas do `backend/sonar-project.properties`: `main.ts`, `*.module.ts`, `data-source.ts`, migrations, seeds, scripts de banco e `backfill-*` |

Os testes de integração (`test/integration`) são opt-in e exigem a base isolada `fiap_fipe_test` (ver [README](../../README.md#testes-de-integração)). Eles **não entram** nos números abaixo.

## 2. Resultado da suíte

| Suítes | Testes | Falhas |
|---|---|---|
| **95 ✓** | **784 ✓** | **0** |

## 3. Cobertura geral

| Recorte | Arquivos | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|
| Jest bruto (todo `src/`) | — | 84,77% | 70,93% | 71,25% | 84,54% |
| **Com as exclusões do SonarQube** | 318 | **86,36%** | **71,59%** | **73,88%** | **86,25%** (4242/4918) |

### Por camada (com exclusões)

| Camada | Arquivos | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|
| `src/domain` | 71 | 87,27% | 87,21% | 89,19% | **87,44%** |
| `src/application` | 97 | 89,42% | 78,02% | 72,15% | **88,95%** |
| `src/infrastructure` | 142 | 83,66% | 52,80% | 61,92% | **83,65%** |
| `src/shared` | 7 | 97,78% | 94,12% | 86,67% | **97,65%** |
| `src/config` | 1 | 100% | 100% | 100% | **100%** |

## 4. Domínios críticos

Foram considerados críticos os domínios que carregam as regras de negócio da oficina: **ordem de serviço** (incluindo orçamento, aprovação e estatísticas), **estoque**, **catálogo de peças e serviços**, **clientes e veículos** e **autenticação**. A meta foi aplicada sobre **linhas**, a mesma métrica que o SonarQube usa para a cobertura.

### Casos de uso (`src/application/use-cases`)

| Domínio | Arquivos | Lines | Branches | Meta 80% |
|---|---|---|---|---|
| Ordens de serviço (`work-orders`) | 9 | 94,78% | 66,67% | ✅ |
| Aprovação do orçamento (`work-order-approvals`) | 5 | 100% | 91,67% | ✅ |
| Estatísticas das OS (`work-order-stats`) | 13 | 98,47% | 90,91% | ✅ |
| Estoque (`stock`) | 3 | 100% | 100% | ✅ |
| Peças (`products`) | 6 | 100% | 100% | ✅ |
| Serviços (`repairs`) | 5 | 100% | 100% | ✅ |
| Veículos (`vehicles`) | 6 | 100% | 100% | ✅ |
| Usuários e clientes (`users`) | 7 | 97,63% | 91,04% | ✅ |
| Autenticação (`auth`) | 4 | 100% | 86,96% | ✅ |
| Permissões (`permissions`) | 2 | 100% | 75,00% | ✅ |

### Entidades e value objects (`src/domain`)

| Arquivo | Lines | Branches | Meta 80% |
|---|---|---|---|
| `work-order.entity.ts` | 91,78% | 80,00% | ✅ |
| `work-order-item.entity.ts` | 97,36% | 94,73% | ✅ |
| `work-order-status.enum.ts` | 100% | 100% | ✅ |
| `stock.entity.ts` | 94,91% | 85,71% | ✅ |
| `stock-movement.entity.ts` | 100% | 100% | ✅ |
| `product.entity.ts` | 97,75% | 94,59% | ✅ |
| `repair.entity.ts` | 97,14% | 94,44% | ✅ |
| `vehicle.entity.ts` | 81,01% | 82,60% | ✅ |
| `user.entity.ts` | 89,65% | 84,37% | ✅ |
| `cpf.vo.ts` / `cnpj.vo.ts` / `phone.vo.ts` | 93,93% / 93,93% / 97,14% | 84,61% / 76,92% / 93,75% | ✅ |

**Todos os domínios críticos estão acima de 80% de linhas.** O ponto de atenção é a cobertura de **branches** nos casos de uso de ordens de serviço (66,67%): os caminhos felizes e os principais erros estão cobertos, mas parte das ramificações de validação não está.

## 5. Lacunas conhecidas (fora dos domínios críticos)

| Área | Lines | Observação |
|---|---|---|
| `application/event-handlers` (auditoria) | 46,26% | Os *handlers* que gravam os eventos de auditoria de cada módulo têm poucos testes diretos. |
| `application/use-cases/events` | 39,19% | Consulta do histórico e CRUD de tipos de evento. |
| `domain/events` e entidades `event` / `event-type` | 72,52% / 58–69% | Definições dos eventos de domínio de clientes, funcionários, estoque e veículos. |
| `infrastructure/database` | 64,46% | Repositórios TypeORM. A persistência é validada pelos testes de integração, que não entram neste número. |

Essas áreas são o módulo transversal de eventos e auditoria ([ADR-008](../adr/adr-008-eventos-dominio-auditoria.md)) e a camada de persistência. São as primeiras candidatas a novos testes se a meta passar a valer para o projeto inteiro.

## 6. Como reproduzir

```bash
cd backend
npm run test:cov:unit
# abrir backend/coverage/lcov-report/index.html
```

Para a visão consolidada por arquivo, envie o `lcov.info` ao SonarQube (`npm run sonar`), conforme o [README](../../README.md#análise-de-código-sonarqube).

## 7. Veredito

**Aprovado.** Os 784 testes unitários passam, e a cobertura total é de **86,25% de linhas** com as exclusões do SonarQube. Todos os domínios críticos (OS, aprovação, estatísticas, estoque, peças, serviços, clientes, veículos e autenticação) superam a meta de 80% do ADR-013. As lacunas estão concentradas no módulo de auditoria e nos repositórios TypeORM.
