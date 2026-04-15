# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (mejor cache de Docker)
COPY package.json package-lock.json* ./
RUN npm ci

# Copiar código y variables de entorno
COPY . .

# Build de producción
# VITE_N8N_URL se pasa como build arg desde EasyPanel
ARG VITE_N8N_URL=https://n8n.srmobic.com/webhook
ENV VITE_N8N_URL=$VITE_N8N_URL

RUN npm run build

# ---- Serve Stage ----
FROM nginx:alpine

# Copiar build output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
