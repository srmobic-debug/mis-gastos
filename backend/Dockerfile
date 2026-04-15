FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código
COPY src ./src

# Exponer puerto
EXPOSE 3001

# Iniciar aplicación
CMD ["node", "src/server.js"]
