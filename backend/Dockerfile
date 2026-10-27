FROM node:24-alpine

# Aplica correções de segurança do Alpine (ex.: OpenSSL) ainda não publicadas na imagem base
RUN apk upgrade --no-cache

# O npm empacotado no node:24-alpine traz brace-expansion/undici vulneráveis
RUN npm install -g npm@11.21.1 && npm cache clean --force

# CVE-2026-109869 (undici 6.29.0, embutido no npm): nenhum npm publicado traz a correção
# (6.29.1) e o undici não é dependência do projeto, então o lock não resolve. Corrigido
# aqui para manter o Node 24 LTS; remover quando o npm embutir o undici >= 6.29.1
RUN cd /tmp \
 && npm pack undici@6.29.1 --silent \
 && tar -xzf undici-6.29.1.tgz \
 && rm -rf "$(npm root -g)/npm/node_modules/undici" \
 && mv package "$(npm root -g)/npm/node_modules/undici" \
 && rm -rf /tmp/undici-6.29.1.tgz /root/.npm

WORKDIR /app
RUN chown node:node /app

# Não roda como root (Trivy DS-0002)
USER node

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
