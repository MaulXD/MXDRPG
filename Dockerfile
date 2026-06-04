FROM node:20-alpine

WORKDIR /app

# Copia os arquivos de dependências
COPY package.json package-lock.json ./

# Instala as dependências de forma limpa
RUN npm ci

# Copia o restante do código do projeto
COPY . .

# Constrói a aplicação Next.js
RUN npm run build

# Expõe a porta padrão do Next.js
EXPOSE 3000

# Executa o projeto (conforme solicitado, usando o ambiente de desenvolvimento)
CMD ["npm", "run", "dev"]
