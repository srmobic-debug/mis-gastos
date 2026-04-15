# Backend Node.js + Express - Guía de Configuración

## ✅ Lo que se ha completado

Se ha creado un backend profesional en Node.js + Express para reemplazar la lógica anterior en n8n. El nuevo backend incluye:

### Backend (Node.js + Express)
- ✅ Servidor Express configurado con CORS
- ✅ Conexión a PostgreSQL con pool de conexiones
- ✅ Autenticación JWT con middleware
- ✅ Manejo de errores centralizado
- ✅ 3 recursos principales:
  - **Autenticación**: POST /api/v1/auth/login
  - **Categorías**: GET /api/v1/categories
  - **Gastos**: GET/POST/PUT/DELETE /api/v1/expenses

### Frontend (React + TypeScript)
- ✅ api.ts configurado para apuntar al nuevo backend
- ✅ Login.tsx actualizado con nuevo flujo
- ✅ useGastos, useCategorias, useResumen actualizados
- ✅ Agregar.tsx, Gastos.tsx, Movimientos.tsx actualizados
- ✅ Tipos (Gasto type alias) compatible con nuevos endpoints

## 🔧 Configuración Necesaria

### 1. Backend - Archivo .env

El archivo `.env` ya existe en `backend/.env` con valores de ejemplo. Debes actualizarlo con tus credenciales reales:

```bash
cd backend
```

Edita `backend/.env`:
```env
# === DATABASE ===
DB_HOST=localhost          # Cambia si PostgreSQL está en otro host
DB_PORT=5432
DB_NAME=srmobic            # Nombre de tu base de datos
DB_USER=postgres           # Usuario de PostgreSQL
DB_PASSWORD=tu_password    # Tu contraseña de PostgreSQL

# === SERVER ===
PORT=3000                  # Puerto del backend
NODE_ENV=development       # O 'production' para producción

# === JWT ===
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion
JWT_EXPIRES_IN=8h

# === FRONTEND ===
FRONTEND_URL=http://localhost:5175  # URL del frontend para CORS
```

**⚠️ IMPORTANTE**: Cambiar `JWT_SECRET` a una clave segura. En producción, usar una clave muy compleja.

### 2. Frontend - Archivo .env.local

En la carpeta `pwa/`, crea un archivo `.env.local`:

```bash
cd ../pwa
```

Copia el template:
```bash
cp .env.example .env.local
```

Edita `pwa/.env.local`:
```env
# URL del backend Express (local en desarrollo)
VITE_BACKEND_URL=http://localhost:3000

# Si deployaste el backend a otro servidor, usa su URL:
# VITE_BACKEND_URL=https://tu-backend-prod.com
```

## 🚀 Iniciar la Aplicación

### Terminal 1 - Backend

```bash
cd backend
npm install          # Solo la primera vez
npm run dev         # Modo desarrollo con auto-reload
# O: npm start       # Modo producción
```

Verás un mensaje como:
```
╔════════════════════════════════════════╗
║  🚀 Backend iniciado correctamente    ║
║  📍 http://localhost:3000              ║
║  🔗 http://localhost:3000/api/v1       ║
╚════════════════════════════════════════╝
```

Verifica que funciona:
```bash
curl http://localhost:3000/api/v1/health
# Respuesta: {"status":"✅ Backend funcionando correctamente"}
```

### Terminal 2 - Frontend

```bash
cd pwa
npm install          # Solo la primera vez
npm run dev         # Vite dev server
```

Abre en el navegador:
```
http://localhost:5175
```

## 🧪 Probando la Aplicación

### 1. Login
- Email: usa un email que exista en la tabla `users` de tu base de datos
- Contraseña: la contraseña debe coincidir (está hasheada con bcryptjs)

Si tienes errores, verifica:
- La base de datos PostgreSQL está corriendo
- Las credenciales en `.env` son correctas
- La tabla `users` existe y tiene datos
- La contraseña está correctamente hasheada

### 2. Gastos (Movimientos)
Después de loguearte:
- **GET** gastos: Los gastos del usuario logueado se cargarán automáticamente
- **POST** nuevo gasto: En la página "Agregar"
- **PUT** editar: En la página "Movimientos"
- **DELETE** eliminar: En la página "Movimientos"

### 3. Categorías
Se cargarán automáticamente desde la base de datos

## 🐛 Troubleshooting

### Error: "Base de datos no disponible" (503)
```
Causas:
- PostgreSQL no está corriendo
- Credenciales en .env son incorrectas
- Base de datos 'srmobic' no existe

Solución:
1. Verifica que PostgreSQL está corriendo
2. Comprueba credenciales: psql -U postgres -d srmobic
3. Si no existe, crearla: createdb srmobic
```

### Error: "Credenciales inválidas" en login (401)
```
Causas:
- Email no existe en tabla users
- Contraseña no coincide
- Tabla users no existe

Solución:
1. Verifica que tienes usuarios en la DB:
   SELECT id, email FROM users;
2. Si no hay, inserta un usuario de prueba:
   INSERT INTO users (id, email, password, name) 
   VALUES (uuid_generate_v4(), 'test@example.com', '$2a$10$...', 'Test User');
   (La contraseña debe estar hasheada con bcryptjs)
```

### Error: "Token requerido" (401) en otros endpoints
```
Esto es normal - significa que el endpoint requiere autenticación.
Asegúrate de que el header Authorization está siendo enviado:
Authorization: Bearer <tu-token-jwt>

El frontend lo hace automáticamente si está logueado.
```

### Error: CORS (Cross-Origin)
```
Si ves errores de CORS en la consola del navegador:
1. Verifica que FRONTEND_URL en backend/.env es correcto:
   FRONTEND_URL=http://localhost:5175
2. Reinicia el backend
```

## 📝 Estructura de Respuestas API

### Login
```json
POST /api/v1/auth/login
Request:  { "email": "user@example.com", "password": "123456" }
Response: {
  "user": { "id": "uuid", "email": "user@example.com", "name": "Juan" },
  "token": "eyJhbGc..."
}
```

### Categorías
```json
GET /api/v1/categories (requiere token)
Response: {
  "categories": [
    { "id": "uuid", "name": "Alimentación", "color": "#FF5733", "icon": "🍔" },
    ...
  ]
}
```

### Gastos
```json
GET /api/v1/expenses (requiere token)
Response: {
  "expenses": [
    {
      "id": "uuid",
      "description": "Compras en mercado",
      "amount": 150.50,
      "date": "2026-04-14",
      "category_id": "uuid",
      "category_name": "Alimentación",
      "category_color": "#FF5733",
      "category_icon": "🍔"
    },
    ...
  ]
}

POST /api/v1/expenses (requiere token)
Request:  {
  "description": "Nuevo gasto",
  "amount": 50.00,
  "date": "2026-04-14",
  "category_id": "uuid-de-categoria"
}
Response: { "expense": { ... } }

PUT /api/v1/expenses/:id (requiere token)
Request:  { "description": "...", "amount": ..., "date": "...", "category_id": "..." }
Response: { "expense": { ... } }

DELETE /api/v1/expenses/:id (requiere token)
Response: { "message": "Gasto eliminado correctamente" }
```

## 🌐 Deployment

Cuando estés listo para ir a producción:

### Backend - Opciones de Hosting
1. **Heroku** (gratis con limitaciones)
2. **Railway** (pago, fácil)
3. **DigitalOcean** (pago, profesional)
4. **Vercel/Netlify** (para frontend)

### Pasos generales:
1. Configurar variable de entorno `JWT_SECRET` segura
2. Cambiar `NODE_ENV=production`
3. Usar base de datos PostgreSQL remota (no local)
4. Actualizar `VITE_BACKEND_URL` en .env.local del frontend

## 📚 Estructura del Proyecto

```
backend/
├── src/
│   ├── server.js                    # Servidor principal
│   ├── config/database.js           # Conexión PostgreSQL
│   ├── middleware/
│   │   ├── auth.js                 # JWT middleware
│   │   └── errorHandler.js         # Manejo de errores
│   ├── routes/
│   │   ├── auth.routes.js          # /api/v1/auth
│   │   ├── categories.routes.js    # /api/v1/categories
│   │   └── expenses.routes.js      # /api/v1/expenses
│   └── controllers/
│       ├── auth.controller.js      # Lógica de login
│       ├── categories.controller.js
│       └── expenses.controller.js  # CRUD de gastos
├── .env                            # Variables (local)
├── .env.example                    # Template
├── package.json
└── README.md

pwa/
├── src/
│   ├── config/api.ts              # Cliente axios
│   ├── context/AuthContext.tsx    # Estado de autenticación
│   ├── hooks/
│   │   ├── useGastos.ts
│   │   ├── useCategorias.ts
│   │   └── useResumen.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Agregar.tsx
│   │   ├── Gastos.tsx
│   │   └── Movimientos.tsx
│   └── types/index.ts             # Tipos TypeScript
├── .env.local                     # Variables (local)
└── .env.example
```

## 🎯 Próximos Pasos

1. ✅ Configurar `.env` del backend
2. ✅ Configurar `.env.local` del frontend
3. ✅ Iniciar backend y frontend
4. ✅ Probar login y CRUD de gastos
5. ⏳ (Opcional) Agregar más funcionalidades:
   - Cambio de contraseña
   - Gestión de usuarios (admin)
   - Filtrado avanzado de gastos
   - Reportes y gráficos
6. ⏳ (Opcional) Deployer a producción

## ❓ Dudas o Errores

Si encuentras problemas:
1. Revisa los logs del backend: `npm run dev` en terminal
2. Abre DevTools (F12) en el navegador para ver errores del frontend
3. Verifica la sección de Troubleshooting arriba
4. Comprueba que PostgreSQL está corriendo y accesible

---

**Backend creado con ❤️ usando Node.js + Express**
