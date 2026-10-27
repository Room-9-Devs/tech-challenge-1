# Relatório — Análise de Segurança frente ao OWASP Top 10

**Data:** 27/10/2026

Avaliação do backend frente aos dez riscos do **OWASP Top 10:2021**, com as mitigações implementadas, as evidências e as lacunas encontradas. Complementa a [análise de vulnerabilidades com Trivy](analise-vulnerabilidades-trivy.md), que cobre dependências, imagem e configuração do `Dockerfile`.

---

## 1. Como foi feita

Revisão do código-fonte em `backend/src` e dos arquivos de infraestrutura, conferindo cada mitigação na implementação — não apenas na documentação. Pontos revisados:

| Área | O que foi conferido |
|---|---|
| Autenticação | `LoginUseCase`, `JwtTokenService`, `JwtAuthGuard`, configuração do `JwtModule` e serviços de hash (scrypt) e token opaco |
| Autorização | `@UseGuards` e `@Roles` em todos os controllers, rota a rota |
| Entrada de dados | `AppValidationPipe` global e filtros, busca e ordenação de todos os repositórios TypeORM |
| Páginas HTML | Escape dos dados e cabeçalhos das páginas de aprovação do orçamento |
| Integrações | Montagem das URLs da API FIPE |
| Infraestrutura | `main.ts`, `docker-compose.yml`, `Dockerfile` e `.github/workflows/trivy.yml` |

**Legenda:** ✅ atendido · ⚠️ atendido com ressalvas · ❌ lacuna relevante.

## 2. Resultado por risco

| Risco | Situação | Mitigações no projeto | Evidência | Lacunas |
|---|---|---|---|---|
| **A01 — Broken Access Control** | ✅ | Todas as rotas protegidas declaram `JwtAuthGuard` e `RolesGuard` com `@Roles` (conferido em todos os controllers). Rotas públicas apenas por desenho: login, refresh, logout e páginas de aprovação. O cliente só consulta e decide a própria OS. O token de aprovação vale apenas para a OS e o cliente a que pertence. CORS não habilitado. | [Coleção do Postman](../api/README.md) (401/403), [E2E](e2e-ordem-de-servico.md) (403), [integração](integracao-fluxo-os.md) ("cliente não vê OS de outro cliente") | O guard não é global: uma rota nova sem `@UseGuards` ficaria aberta. |
| **A02 — Cryptographic Failures** | ⚠️ | Senhas com scrypt e comparação em tempo constante (`timingSafeEqual`). Refresh token e token de aprovação com 48 bytes aleatórios, guardados apenas como hash SHA-256. `JWT_SECRET` obrigatório para a aplicação subir. | [Modelo de dados](../database/README.md), [ADR-011](../adr/adr-011-aprovacao-orcamento-por-email.md) | Sem TLS no ambiente local (HTTP); um ambiente publicado exigiria HTTPS. |
| **A03 — Injection** | ✅ | Consultas pelo TypeORM com valores sempre parametrizados. Nomes de coluna vêm de listas fixas no servidor (`allowedFilters`, colunas de busca e de ordenação), nunca da requisição. Validação global com `whitelist` e `forbidNonWhitelisted`, que rejeita campos não declarados. Páginas HTML escapam todos os dados dinâmicos (`escapeHtml`). | Repositórios TypeORM, `AppValidationPipe`, [ADR-007](../adr/adr-007-padrao-listagem.md) | — |
| **A04 — Insecure Design** | ✅ | Regras de negócio protegidas pelo domínio (transições de status, trava de itens, pagamento antes da execução). O `GET` do link de aprovação não altera estado, pois filtros de e-mail abrem links automaticamente. Links montados com `APP_PUBLIC_URL`, nunca com o cabeçalho `Host`. Token de aprovação de uso único, com validade e revogação. Bloqueio pessimista contra decisões e reservas concorrentes. | [ADR-010](../adr/adr-010-reserva-estoque-orcamento.md), [ADR-011](../adr/adr-011-aprovacao-orcamento-por-email.md), [integração](integracao-fluxo-os.md) | Não há modelagem de ameaças documentada. |
| **A05 — Security Misconfiguration** | ⚠️ | Container executado sem root. `Dockerfile` verificado pelo Trivy (*misconfig*). `.env` fora do controle de versão. `synchronize: false`. Erros inesperados retornam mensagem genérica, sem *stack trace*. Páginas de aprovação com `Content-Security-Policy`, `Referrer-Policy: no-referrer` e `Cache-Control: no-store`. | [Relatório Trivy](analise-vulnerabilidades-trivy.md) | As respostas JSON da API não enviam cabeçalhos de segurança (ex.: Helmet). Ferramentas de apoio expostas no ambiente local: Adminer na porta 8080 com imagem `latest` e banco do SonarQube com senha padrão no `docker-compose.yml`. |
| **A06 — Vulnerable and Outdated Components** | ✅ | Trivy em todo PR, em push para `main`/`develop` e semanalmente, falhando em `HIGH`/`CRITICAL` com correção. Correções já aplicadas em `proxy-addr`, `handlebars`, `brace-expansion`, npm e `undici`. | [Relatório Trivy](analise-vulnerabilidades-trivy.md), [ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md) | Vulnerabilidades sem correção publicada em dependências de desenvolvimento, aceitas e registradas no relatório. |
| **A07 — Identification and Authentication Failures** | ⚠️ | Login e renovação de token limitados a 20 tentativas por minuto por IP (`ThrottlerGuard`, configurável por `AUTH_THROTTLE_LIMIT`), com resposta 429 acima do limite. Token de acesso de 15 minutos. Refresh token rotacionado a cada renovação e revogado no logout. Login responde da mesma forma para usuário inexistente e senha errada, comparando contra um hash fictício para não revelar quais usuários existem. Tentativas falhas registradas (`auth.login.failed`). | `AuthController`, `LoginUseCase`, teste `auth-throttling.spec.ts` | Política de senha exige apenas 8 caracteres. |
| **A08 — Software and Data Integrity Failures** | ✅ | *Actions* do GitHub fixadas por SHA (comprometimento do `trivy-action`, CVE-2026-33634) e versão do Trivy fixada. Dependências travadas pelo `package-lock.json`. Schema versionado por migrations. Branch `main` alterada apenas por *pull request*. | [ADR-014](../adr/adr-014-analise-vulnerabilidades-trivy.md), [trivy.yml](../../.github/workflows/trivy.yml) | Imagem Docker sem assinatura. |
| **A09 — Security Logging and Monitoring Failures** | ⚠️ | Histórico de auditoria de todas as entidades, com autor, data e metadados, incluindo logins bem-sucedidos e falhos com o IP e o User-Agent de origem. Tokens e senhas não são gravados em log. | [Eventos de Domínio](../ddd/eventos-de-dominio.md), [ADR-008](../adr/adr-008-eventos-dominio-auditoria.md) | Sem monitoramento nem alertas. Auditoria gravada fora da transação (ADR-008). |
| **A10 — Server-Side Request Forgery** | ✅ | A única chamada de saída que usa dados da requisição é a consulta à FIPE, com URL base fixa (`https://fipe.parallelum.com.br/api/v2`) e segmentos codificados com `encodeURIComponent`. O Resend é chamado pelo SDK oficial. | `ParallelumFipeGateway`, [README](../../README.md#consulta-fipe) | — |

## 3. Checklist de JWT

| Cuidado | Situação | Detalhe |
|---|---|---|
| Validar a assinatura | ✅ | `JwtAuthGuard` → `JwtService.verify` |
| Validar a expiração (`exp`) | ✅ | 15 minutos (`JWT_EXPIRES_IN`) |
| Validar emissor (`iss`) e destino (`aud`) | ❌ | Não definidos na emissão nem verificados |
| Validade curta | ✅ | 15 minutos, com renovação por refresh token |
| Sem dados sensíveis no payload | ✅ | Apenas `sub`, `role` e `entityType` |
| Usar HTTPS | ⚠️ | Não no ambiente local |
| Não colocar o JWT na URL | ✅ | Enviado no cabeçalho `Authorization`; o link de aprovação usa um token opaco próprio, não o JWT |
| Não registrar o token em log | ✅ | Nenhum log grava tokens |
| Proteger a chave de assinatura | ✅ | `JWT_SECRET` lido do `.env`, fora do controle de versão |
| Validar o acesso na API | ✅ | Guards e papéis no backend; não há frontend |
| Refresh token com rotação | ✅ | O token anterior deixa de valer a cada renovação |
| Fixar o algoritmo aceito | ⚠️ | Não fixado explicitamente; com segredo compartilhado, a biblioteca aceita apenas a família HMAC (HS256 por padrão) |

## 4. Lacunas e ações recomendadas

| # | Lacuna | Risco | Ação recomendada | Prioridade |
|---|---|---|---|---|
| 1 | Política de senha só com tamanho mínimo | A07 | Exigir combinação de caracteres ou verificar senhas comuns | Média |
| 2 | Guard não global | A01 | Guard global com decorator `@Public()` para as rotas abertas | Média |
| 3 | JWT sem `iss`/`aud` e algoritmo implícito | A02/A07 | Definir `issuer`, `audience` e `algorithms: ['HS256']` | Baixa |
| 4 | Sem cabeçalhos de segurança nas respostas JSON | A05 | Helmet no `main.ts` | Baixa |
| 5 | Ferramentas de apoio expostas no compose | A05 | Fixar a versão do Adminer e mover a senha do `sonar-db` para variável de ambiente | Baixa |

As lacunas não comprometem o uso do sistema no ambiente local de avaliação.

**Corrigidas após a primeira análise (27/10/2026):** o limite de tentativas no login e na renovação de token (A07) e o registro do IP e do User-Agent nos eventos de login (A09).

## 5. Veredito

**Atendido com ressalvas.** Seis dos dez riscos estão mitigados integralmente (A01, A03, A04, A06, A08 e A10) e quatro com ressalvas: A02 e A05, por questões do ambiente local; A07, pela política de senha simples; e A09, pela falta de monitoramento. Nenhum risco ficou sem mitigação.
