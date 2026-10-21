FROM node:24-alpine

# Aplica correções de segurança do Alpine (ex.: OpenSSL) ainda não publicadas na imagem base
RUN apk upgrade --no-cache

# O npm empacotado no node:24-alpine traz brace-expansion/undici vulneráveis
RUN npm install -g npm@11.21.1 && npm cache clean --force

WORKDIR /app
RUN chown node:node /app

# Não roda como root (Trivy DS-0002)
USER node

COPY --chown=node:node package*.json ./
RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
