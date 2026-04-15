# Mis Gastos - Backend API

Backend profesional con Node.js y Express para la aplicación "Mis Gastos" (gestor de gastos).

## Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y actualiza los valores con tu configuración:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales reales:

```env
# === DATABASE ===
DB_HOST=localhost        # Host del servidor PostgreSQL
DB_PORT=5432            # Puerto de PostgreSQL
DB_NAME=srmobic         # Nombre de la base de datos
DB_USER=postgres        # Usuario de PostgreSQL
DB_PASSWORD=tu_password # Contraseña de PostgreSQL

# === SERVER ===
PORT=3000               # Puerto del servidor
NODE_ENV=development    # development o production

# === JWT ===
JWT_SECRET=tu_secret_key_aqui  # Clave secreta para firmar tokens JWT
JWT_EXPIRES_IN=8h              # Tiempo de expiración del token

# === FRONTEND ===
FRONTEND_URL=http://localhost:5175  # URL del frontend para CORS
```

### 3. Verificar Conexión a la Base de Datos

Asegúrate de que:
- PostgreSQL está corriendo
- La base de datos `srmobic` existe
- El usuario `postgres` tiene acceso
- Las tablas existen (users, categories, expenses)

### 4. Iniciar el Servidor

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## API Endpoints

### Autenticación

**POST** `/api/v1/auth/login`
- Request:
  ```json
  {
    "email": "usuario@example.com",
    "password": "password123"
  }
  ```
- Response:
  ```json
  {
    "user": {
      "id": "uuid-string",
      "email": "usuario@example.com",
      "name": "Nombre del Usuario"
    },
    "token": "jwt-token-here"
  }
  ```

### Categorías (requiere token JWT)

**GET** `/api/v1/categories`
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "categories": [
      {
        "id": "uuid",
        "name": "Alimentación",
        "color": "#FF5733",
        "icon": "🍔"
      },
      ...
    ]
  }
  ```

### Gastos (requieren token JWT)

**GET** `/api/v1/expenses`
- Get todos los gastos del usuario autenticado

**GET** `/api/v1/expenses/summary/total`
- Get resumen de gastos (total, cantidad, promedio)

**POST** `/api/v1/expenses`
- Crear nuevo gasto
- Request:
  ```json
  {
    "description": "Compras en mercado",
    "amount": 125.50,
    "date": "2026-04-14",
    "category_id": "uuid-of-category"
  }
  ```

**PUT** `/api/v1/expenses/:id`
- Actualizar un gasto existente

**DELETE** `/api/v1/expenses/:id`
- Eliminar un gasto

## Estructura del Proyecto

```
backend/
├── src/
│   ├── server.js                 # Servidor Express principal
│   ├── config/
│   │   └── database.js           # Configuración de PostgreSQL
│   ├── middleware/
│   │   ├── auth.js              # Middleware de autenticación JWT
│   │   └── errorHandler.js      # Manejador de errores
│   ├── routes/
│   │   ├── auth.routes.js       # Rutas de autenticación
│   │   ├── categories.routes.js # Rutas de categorías
│   │   └── expenses.routes.js   # Rutas de gastos
│   └── controllers/
│       ├── auth.controller.js   # Lógica de autenticación
│       ├── categories.controller.js # Lógica de categorías
│       └── expenses.controller.js   # Lógica de gastos
├── .env                          # Variables de entorno
├── .env.example                  # Template de variables
├── package.json                  # Dependencias del proyecto
└── README.md                     # Este archivo
```

## Troubleshooting

### Error: "Base de datos no disponible"
- Verifica que PostgreSQL está corriendo
- Verifica que las credenciales en `.env` son correctas
- Verifica que la base de datos `srmobic` existe

### Error: "Token requerido"
- El endpoint requiere autenticación
- Agrega el header: `Authorization: Bearer <tu-token-jwt>`

### Error: "Credenciales inválidas" en login
- Verifica que el email existe en la tabla `users`
- Verifica que la contraseña es correcta
- Las contraseñas se almacenan con hash bcryptjs

## Desarrollo

Para agregar nuevas funcionalidades:

1. **Crear controlador**: `src/controllers/name.controller.js`
2. **Crear rutas**: `src/routes/name.routes.js`
3. **Importar en `server.js`**: `app.use('/api/v1/name', nameRoutes);`

## Notas de Seguridad

- Nunca commits `.env` (ya está en `.gitignore`)
- Cambia `JWT_SECRET` en producción a una clave muy segura
- Usa HTTPS en producción
- Valida siempre el input del usuario (está implementado en controladores)
- Los tokens JWT expiran después del tiempo especificado en `JWT_EXPIRES_IN`

## Deployment

Para deployar a un servidor (Heroku, Railway, DigitalOcean, etc.):

1. Actualiza `JWT_SECRET` a un valor seguro
2. Configura `NODE_ENV=production`
3. Usa una base de datos PostgreSQL remota
4. Configura las variables de entorno en el servidor
5. Corre `npm start`

Ejemplo para Heroku:
```bash
heroku create mi-app
heroku config:set JWT_SECRET=super_secret_key_aqui
git push heroku main
```
