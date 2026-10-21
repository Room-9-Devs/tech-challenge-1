# ADR-014 — Análise de Vulnerabilidades com Trivy

- **Status:** Aprovado
- **Data:** 19/10/2026
- **Autor:** Matheus Andrell
- **Revisores:** Felipe Santana, Julio Cavalcanti, Kevin Villanova, Michel Lisboa

## Contexto

O projeto precisa garantir boas práticas de segurança e apresentar o resultado de uma análise de vulnerabilidades.

O backend depende de diversos pacotes npm e é distribuído como uma imagem Docker baseada em uma imagem oficial do Node.js. Vulnerabilidades podem surgir nas dependências, no sistema operacional da imagem, em credenciais versionadas por engano ou em configurações inseguras do `Dockerfile` e do `docker-compose.yml`. Além disso, novas vulnerabilidades são publicadas continuamente, inclusive para dependências que já estão no projeto.

## Decisão

Adotar o **Trivy** para a análise de vulnerabilidades, executado automaticamente no **GitHub Actions** e disponível para execução local.

### Abrangência

O Trivy é executado em duas frentes:

- **Repositório:** vulnerabilidades nas dependências (`package-lock.json`), credenciais versionadas (*secrets*) e configurações inseguras do `Dockerfile` e do `docker-compose.yml` (*misconfig*).
- **Imagem:** *build* da imagem do backend e análise das vulnerabilidades do sistema operacional base e dos pacotes Node.js instalados.

### Regras

- A análise **falha** quando encontra vulnerabilidades de severidade `HIGH` ou `CRITICAL` que já possuem correção disponível.
- Vulnerabilidades sem correção publicada são ignoradas, pois não há ação possível.
- Exceções aceitas pela equipe ficam no arquivo `.trivyignore`, sempre com justificativa.
- As regras ficam em `trivy.yaml`, usado tanto no CI quanto na execução local.

### Execução

- No CI (`.github/workflows/trivy.yml`): em todo *pull request*, em todo *push* para `main` e `develop`, semanalmente (toda segunda-feira) para detectar vulnerabilidades novas em dependências já existentes, e sob demanda.
- Localmente: `npm run security:scan`, que executa o Trivy em um container Docker, sem precisar instalá-lo.
- A versão do Trivy é fixada, e as *actions* do GitHub são referenciadas pelo *hash* do commit, e não pela *tag*, devido ao comprometimento das *tags* do `trivy-action` em março de 2026. Também são evitadas as versões do Trivy afetadas por esse incidente.

## Alternativas consideradas

### `npm audit`

Ferramenta nativa do npm para verificar vulnerabilidades nas dependências.

Não exige instalação, mas analisa apenas os pacotes npm: não verifica a imagem Docker, credenciais versionadas nem configurações inseguras.

**Decisão:** Não adotado.

### Snyk

Plataforma de análise de segurança com integração ao GitHub e plano gratuito.

Cobre dependências e imagens, mas exige conta e token de um serviço externo, e o plano gratuito limita a quantidade de análises. O Trivy é gratuito, de código aberto e funciona sem cadastro.

**Decisão:** Não adotado.

### OWASP Dependency-Check

Ferramenta de código aberto para identificar dependências com vulnerabilidades conhecidas.

Cobre apenas as dependências e tem suporte mais limitado ao ecossistema Node.js do que o Trivy.

**Decisão:** Não adotado.

## Consequências

### Positivas

- Uma única ferramenta cobre dependências, imagem Docker, credenciais e configurações
- Vulnerabilidades graves fazem a verificação falhar nos *pull requests*, tornando o problema visível antes do merge
- A execução semanal detecta vulnerabilidades publicadas depois que a dependência entrou no projeto
- A execução local não exige instalar o Trivy, apenas o Docker
- A fixação de versões e de *hashes* reduz o risco de ataques à cadeia de suprimentos do próprio CI

### Negativas

- O resultado fica apenas no log do GitHub Actions ou no terminal: para a entrega, o relatório da análise precisa ser gerado e salvo separadamente
- A versão do Trivy precisa ser mantida igual no workflow e no script local
- A atualização das *actions* exige resolver manualmente o *hash* de cada nova versão
- Uma vulnerabilidade nova em uma dependência pode fazer o CI falhar sem nenhuma alteração no código, exigindo atualização da dependência ou registro de exceção
