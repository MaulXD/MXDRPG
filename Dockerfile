FROM node:26-alpine3.23

WORKDIR /app

ARG GIT_SHA=dev
ENV BUILD_SHA=${GIT_SHA}

# Copia os arquivos de dependências
COPY package.json package-lock.json ./

# Instala as dependências de forma limpa
RUN npm ci

# Copia o restante do código do projeto
COPY . .

# Invalida cache do npm run build a cada commit
ARG GIT_SHA=dev
RUN echo "build-sha=${GIT_SHA}" > /app/.build-id \
  && npm run build \
  && mkdir -p .next/cache/images .next/cache/fetch-cache

# Expõe a porta padrão do Next.js
EXPOSE 3000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
# Executa o projeto em produção
CMD ["npm", "start"]
