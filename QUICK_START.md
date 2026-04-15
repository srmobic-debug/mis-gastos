# 🚀 Quick Start - Mis Gastos

## Para Desarrolladores

### Opción 1: Iniciar TODO en desarrollo (Recomendado)

**Terminal 1 - Backend**
```bash
cd backend
npm install    # Solo primera vez
npm run dev    # Reinicia automáticamente al cambiar código
```

**Terminal 2 - Frontend**
```bash
cd pwa
npm install    # Solo primera vez
npm run dev    # Vite dev server con HMR
```

**Terminal 3 - (Opcional) Base de Datos**
```bash
# Si tienes PostgreSQL instalado localmente
psql -U postgres -d srmobic
# O si usas Docker:
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=srmobic \
  postgres:15
```

Luego abre: **http://localhost:5175**

---

## ⚙️ Configuración Rápida

### 1. Backend - Variables de Entorno

**Archivo: `backend/.env`**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=srmobic
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
NODE_ENV=development
JWT_SECRET=tu-clave-super-segura-aqui
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5175
```

### 2. Frontend - Variables de Entorno

**Archivo: `pwa/.env.local`** (crear si no existe)
```env
VITE_BACKEND_URL=http://localhost:3000
```

---

## ✅ Verificación Rápida

### Backend funcionando?
```bash
curl http://localhost:3000/api/v1/health
# Debe responder: {"status":"✅ Backend funcionando correctamente"}
```

### Frontend funcionando?
Abre: http://localhost:5175
Deberías ver la pantalla de login

### Base de datos ok?
```bash
psql -U postgres -d srmobic -c "SELECT COUNT(*) FROM users;"
# Debe retornar un número
```

---

## 📁 Archivos Importantes

```
backend/
├── src/server.js              ← Punto de entrada
├── src/config/database.js     ← Conexión BD
├── src/middleware/auth.js     ← Autenticación
├── src/controllers/           ← Lógica de negocio
├── src/routes/                ← Definición de endpoints
├── .env                        ← Configuración (no commitear)
└── package.json               ← Dependencias

pwa/
├── src/config/api.ts          ← Cliente HTTP
├── src/context/AuthContext.tsx ← Estado global
├── src/hooks/                 ← Custom hooks
├── src/pages/                 ← Componentes de página
└── .env.local                 ← Configuración (no commitear)
```

---

## 🔥 Comandos Útiles

### Backend
```bash
# Desarrollo
cd backend && npm run dev

# Producción
npm start

# Ver logs
tail -f logs/app.log
```

### Frontend
```bash
# Desarrollo con HMR
cd pwa && npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Base de Datos
```bash
# Conectar
psql -U postgres -d srmobic

# Usuarios
SELECT id, email, name FROM users;

# Gastos
SELECT * FROM expenses WHERE user_id = 'UUID';

# Categorías
SELECT * FROM categories;
```

---

## 🧪 Flujo de Testing Manual

### 1. Login
1. Abre http://localhost:5175
2. Email: usa un email que existe en `users`
3. Password: la contraseña correspondiente
4. ✅ Deberías ver el dashboard

### 2. Ver Gastos
1. Click en "Gastos" o "Movimientos"
2. ✅ Deberían cargar los gastos del usuario

### 3. Agregar Gasto
1. Click en "+" o "Agregar"
2. Llena: Monto, Descripción, Categoría, Fecha
3. Click en "Guardar"
4. ✅ Deberías ver el nuevo gasto en la lista

### 4. Editar Gasto
1. En "Movimientos", click en el gasto
2. Modifica campos
3. Guarda
4. ✅ Cambios reflejados

### 5. Eliminar Gasto
1. En "Gastos", click en el botón de eliminar
2. Confirma
3. ✅ Gasto desaparece

---

## 🐛 Debug

### Backend - Ver errores
```bash
# En la terminal donde corre "npm run dev"
# Todos los errores se imprimen automáticamente
```

### Frontend - DevTools
```bash
# Presiona F12 en el navegador
# Console tab para ver errores
# Network tab para ver las API calls
```

### API calls desde CLI
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pwd123"}'

# Gastos (necesita token)
curl http://localhost:3000/api/v1/expenses \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## 📚 Documentación Completa

- **Configuración detallada**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **Resumen de migración**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- **API Reference**: [backend/README.md](./backend/README.md)

---

## 🚨 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Error de conexión a BD" | Verifica que PostgreSQL corre en localhost:5432 |
| "CORS error" | Asegúrate que FRONTEND_URL en .env es correcto |
| "Token expirado" | Logout y login de nuevo, o reinicia frontend |
| "Endpoint 404" | Verifica que el endpoint está implementado en backend |
| "Puerto en uso" | Cambia PORT en .env o cierra la app anterior |

---

## 💡 Tips

1. **Hot Module Reload**: El frontend recarga automáticamente (Vite)
2. **Nodemon**: El backend reinicia automáticamente al cambiar código
3. **localStorage**: Tokens se guardan en el navegador (DevTools → Application)
4. **Logs**: Abre la consola del navegador para errores del frontend
5. **Network tab**: Inspecciona las peticiones HTTP en DevTools

---

**¿Todo ok? Listo para codificar! 🎉**
