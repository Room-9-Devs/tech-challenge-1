# Relatório — Análise de Vulnerabilidades com Trivy

**Data:** 27/10/2026

Resultado da análise de vulnerabilidades do backend com o Trivy, conforme a decisão e as regras do [ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md).

---

## 1. Como foi gerado

Execução local, a partir de `backend/`, com o mesmo `trivy.yaml` usado no GitHub Actions:

```bash
npm run security:scan
```

| Item | Valor |
|---|---|
| Trivy | v0.76.0 (imagem `aquasec/trivy:0.76.0`) |
| Base de vulnerabilidades | v2, atualizada em 27/10/2026 13:12 UTC |
| Imagem analisada | `tech-challenge-backend:local` (`sha256:ece12fa2fbfa…`), *build* de `backend/Dockerfile` |
| Base da imagem | `node:24-alpine`: Alpine 3.24.3, Node.js v24.22.1, npm 11.21.1 |
| Política | Falha em `HIGH`/`CRITICAL` com correção disponível; vulnerabilidades sem correção são ignoradas ([`trivy.yaml`](../../trivy.yaml)) |
| Exceções aceitas | Nenhuma ([`.trivyignore`](../../.trivyignore) vazio) |

## 2. Resultado da verificação

| Análise | Alvo | Pacotes | Vulnerabilidades `HIGH`/`CRITICAL` | Secrets | Misconfig | Resultado |
|---|---|---|---|---|---|---|
| Repositório | `backend/package-lock.json` | 758 | **0** | — | — | ✅ |
| Repositório | `backend/Dockerfile` | — | — | — | **0** falhas (20 verificações) | ✅ |
| Repositório | Todos os arquivos versionados | — | — | **0** | — | ✅ |
| Imagem | SO (Alpine 3.24.3) | 19 | **0** | — | — | ✅ |
| Imagem | Pacotes Node.js (app e npm global) | 961 | **0** | **0** | — | ✅ |

```
✅ Nenhum problema HIGH/CRITICAL encontrado.
```

## 3. Visão completa (informativa)

Além da verificação, foi feita uma passada com **todas as severidades**, incluindo as dependências de desenvolvimento e as vulnerabilidades sem correção, para registrar o que existe abaixo da linha de corte:

| Severidade | Vulnerabilidade | Pacote | Correção | Origem | Por que não bloqueia |
|---|---|---|---|---|---|
| HIGH | CVE-2026-85393 (falsificação de assinatura RSA) | `node-forge` 1.4.0 | Sem correção publicada | `sonarqube-scanner` (dev) | Sem correção disponível |
| MEDIUM | CVE-2026-111997 (DoS por excesso de caracteres `%` em endereços IP) | `ip-address` 10.7.2 | 10.7.4 | npm empacotado na imagem | Abaixo da linha de corte |

O scan do repositório (`package-lock.json`, incluindo as dependências de desenvolvimento) não encontrou nenhuma vulnerabilidade, de nenhuma severidade. O SO da imagem também não tem nenhuma.

Os dois pacotes acima **não são carregados pela API em execução**: o `node-forge` é dependência de desenvolvimento e aparece na imagem porque o `Dockerfile` atual é de desenvolvimento (`npm install` completo e `npm run start:dev`); o `ip-address` faz parte do npm instalado globalmente na imagem.

## 4. Correções aplicadas

### Primeira análise (19/10/2026)

A primeira execução do Trivy no projeto apontou os problemas abaixo, corrigidos na branch `20_utilizar_trivy`:

| Achado | Severidade | Correção |
|---|---|---|
| `proxy-addr` 2.0.7 (IP spoofing), via `express` | CRITICAL | Atualizado para 2.0.8 no `package-lock.json` |
| `handlebars` 4.7.9, via `ts-jest` | CRITICAL | Atualizado para 4.7.10 |
| `brace-expansion` 1.1.18 / 2.1.4 / 5.0.9 (DoS) | HIGH | Atualizado para 1.1.21 / 2.1.7 / 5.0.12 |
| Container executado como `root` (DS-0002) | HIGH | `USER node` no `Dockerfile` |
| Imagem base `node:20-alpine` (Node 20 fora de suporte desde abril/2026) | — | Trocada por `node:24-alpine` |
| OpenSSL do Alpine (`libssl3`/`libcrypto3`) | HIGH | `apk upgrade` no *build* |
| npm empacotado na imagem (`tar`, `undici`, `brace-expansion`, `sigstore` etc.) | HIGH/CRITICAL | npm fixado em 11.21.1 |

| | `package-lock.json` | `Dockerfile` | Imagem |
|---|---|---|---|
| **Antes** (19/10/2026) | 3 | 1 | 44 |
| **Depois** (27/10/2026) | **0** | **0** | **0** |

*Achados `HIGH`/`CRITICAL` com correção disponível.*

### Desde a análise anterior (22/10/2026)

| Mudança | Efeito |
|---|---|
| Nova dependência `@nestjs/throttler` 6.5.0 (licença MIT), para limitar tentativas de login | Nenhuma vulnerabilidade; o `package-lock.json` passou de 757 para 758 pacotes |
| Reconstrução da imagem: Alpine 3.24.2 → 3.24.3 e Node.js v24.22.0 → v24.22.1 | `musl`/`musl-utils` atualizados para 1.2.6-r3, corrigindo a CVE-2026-107891 |
| `fast-uri` atualizado para 3.1.9 | Corrige a CVE-2026-86472 (normalização de host) |
| CVE-2026-93687 (`braces` 3.0.3) | Deixou de ser apontada pela base de vulnerabilidades |

## 5. Observações

1. **`docker-compose.yml`:** o Trivy não tem verificador de configuração para arquivos do Docker Compose. A análise de *misconfig* cobre o `Dockerfile`. O `docker-compose.yml` é analisado apenas pelo verificador de *secrets*.
2. **Imagem de desenvolvimento:** uma imagem de produção em *multi-stage*, só com `npm ci --omit=dev` e `node dist/main`, eliminaria da imagem o `node-forge` da seção 3.
3. **npm empacotado:** o `ip-address` 10.7.4 chegará à imagem quando uma nova versão do npm o incluir; a versão do npm é fixada no `Dockerfile`.
4. **Execução contínua:** o workflow [`.github/workflows/trivy.yml`](../../.github/workflows/trivy.yml) repete esta verificação em todo *pull request*, em todo *push* para `main`/`develop` e semanalmente, com as actions fixadas por SHA (CVE-2026-33634).

## 6. Como reproduzir

Só é necessário o Docker em execução. A partir de `backend/`:

```bash
npm run security:scan        # repositório + imagem
npm run security:scan:fs     # só repositório
npm run security:scan:image  # só imagem
```

O comando termina com código 1 se encontrar achados `HIGH`/`CRITICAL` com correção disponível.

## 7. Veredito

**Aprovado.** Nenhuma vulnerabilidade `HIGH` ou `CRITICAL` com correção disponível foi encontrada no repositório nem na imagem do backend. Também não há *secrets* versionados nem falhas de configuração no `Dockerfile`. A única vulnerabilidade alta restante está em uma dependência de desenvolvimento e ainda não tem correção publicada.
