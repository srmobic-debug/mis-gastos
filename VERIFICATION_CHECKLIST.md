# ✅ Verificación del Setup - Checklist

Sigue estos pasos para verificar que todo está correctamente configurado.

## 🔧 Prerequisitos

- [ ] PostgreSQL instalado y corriendo en localhost:5432
- [ ] Node.js v14+ instalado (`node --version`)
- [ ] npm v6+ instalado (`npm --version`)
- [ ] Base de datos 'srmobic' existe
- [ ] Tabla 'users' tiene al menos un usuario

---

## 1️⃣ Configuración de Backend

### 1.1 - Archivos Necesarios
- [ ] `backend/.env` existe
- [ ] `backend/package.json` existe
- [ ] `backend/src/server.js` existe
- [ ] `backend/src/config/database.js` existe
- [ ] `backend/src/middleware/auth.js` existe
- [ ] `backend/src/middleware/errorHandler.js` existe
- [ ] `backend/src/routes/auth.routes.js` existe
- [ ] `backend/src/routes/categories.routes.js` existe
- [ ] `backend/src/routes/expenses.routes.js` existe

### 1.2 - Variables de Entorno
En `backend/.env`, verifica que existen:
- [ ] `DB_HOST=localhost`
- [ ] `DB_PORT=5432`
- [ ] `DB_NAME=srmobic`
- [ ] `DB_USER=postgres`
- [ ] `DB_PASSWORD=<tu-password>`
- [ ] `PORT=3000`
- [ ] `JWT_SECRET=<clave-segura>`
- [ ] `FRONTEND_URL=http://localhost:5175`

### 1.3 - Dependencias Instaladas
```bash
cd backend
npm list
```
Verifica que estén instaladas:
- [ ] express
- [ ] pg
- [ ] dotenv
- [ ] jsonwebtoken
- [ ] bcryptjs
- [ ] cors
- [ ] uuid

---

## 2️⃣ Configuración de Frontend

### 2.1 - Archivos Necesarios
- [ ] `pwa/.env.local` existe (o cópialo de .env.example)
- [ ] `pwa/src/config/api.ts` apunta a `http://localhost:3000`
- [ ] `pwa/src/pages/Login.tsx` usa `email` y no `login`
- [ ] `pwa/src/hooks/useGastos.ts` usa `/api/v1/expenses`
- [ ] `pwa/src/hooks/useCategorias.ts` usa `/api/v1/categories`

### 2.2 - Variables de Entorno
En `pwa/.env.local`, verifica:
- [ ] `VITE_BACKEND_URL=http://localhost:3000`

### 2.3 - Dependencias Instaladas
```bash
cd pwa
npm list
```
Verifica que estén instaladas (principales):
- [ ] react
- [ ] react-router-dom
- [ ] axios
- [ ] tailwindcss

---

## 3️⃣ Base de Datos

### 3.1 - Conexión
```bash
psql -U postgres -d srmobic -c "SELECT 1;"
```
- [ ] ✅ Retorna `1` (sin errores)

### 3.2 - Tablas Necesarias
```bash
psql -U postgres -d srmobic -c "\dt"
```
Verifica que existan:
- [ ] `users` table
- [ ] `categories` table
- [ ] `expenses` table

### 3.3 - Datos de Prueba
```bash
# Verificar usuarios
psql -U postgres -d srmobic -c "SELECT id, email, name FROM users LIMIT 3;"
```
- [ ] Al menos 1 usuario existe
- [ ] El usuario tiene email y contraseña hasheada

### 3.4 - Password Hasheado
```bash
# En PostgreSQL, las contraseñas deben estar hasheadas con bcryptjs
# Ejemplo: $2a$10$dXJ3SW6G7P50eS5qGBcfue...
SELECT id, email, password FROM users LIMIT 1;
```
- [ ] El password comienza con `$2a$` o `$2b$` (bcryptjs hash)

---

## 🚀 Iniciar Aplicación

### 4.1 - Terminal 1: Backend
```bash
cd backend
npm run dev
```
Verifica la salida:
- [ ] `🚀 Backend iniciado correctamente`
- [ ] `📍 http://localhost:3000`

### 4.2 - Terminal 2: Frontend
```bash
cd pwa
npm run dev
```
Verifica la salida:
- [ ] `VITE vx.x.x ready in xxx ms`
- [ ] `➜  Local: http://localhost:5175`

### 4.3 - Abre en Navegador
Navega a: `http://localhost:5175`
- [ ] Se carga la página de login
- [ ] No hay errores en la consola (F12)

---

## ✔️ Testing Funcional

### 5.1 - Health Check
```bash
curl http://localhost:3000/api/v1/health
```
- [ ] Retorna: `{"status":"✅ Backend funcionando correctamente"}`

### 5.2 - Login
1. En la página de login, ingresa:
   - [ ] Email: (un email que existe en users)
   - [ ] Password: (la contraseña correcta)
2. Click "Ingresar"
- [ ] ✅ Redirige al dashboard
- [ ] ✅ Vés "Gastos", "Movimientos", etc. en el menú

### 5.3 - Gastos
Una vez logueado:
1. Click en "Gastos" o "Movimientos"
- [ ] ✅ Se cargan los gastos (vacío o con datos)
- [ ] ✅ Sin errores en la consola

2. (Si hay gastos) Intenta editar uno
- [ ] ✅ Se abre modal de edición
- [ ] ✅ Guarda sin errores

3. (Si hay gastos) Intenta eliminar uno
- [ ] ✅ Solicita confirmación
- [ ] ✅ Se elimina correctamente

### 5.4 - Agregar Gasto
1. Click en "+" o "Agregar"
- [ ] ✅ Se abre formulario

2. Llena los campos:
   - [ ] Monto: 50.00
   - [ ] Descripción: "Gasto de prueba"
   - [ ] Categoría: cualquiera
   - [ ] Fecha: hoy

3. Click "Guardar"
- [ ] ✅ Muestra mensaje de éxito
- [ ] ✅ Redirige a movimientos
- [ ] ✅ El nuevo gasto aparece en la lista

### 5.5 - Categorías
1. Si hay página de categorías
- [ ] ✅ Se cargan las categorías
- [ ] ✅ Muestra nombre, color e icono

---

## 🔐 Seguridad

### 6.1 - JWT Token
En DevTools → Application → Local Storage:
- [ ] Existe clave `auth`
- [ ] Contiene `user` y `token`
- [ ] El token es válido (3 partes separadas por `.`)

### 6.2 - CORS
1. Abre DevTools → Network
2. Hace cualquier petición (ej: click en Gastos)
- [ ] ✅ Las peticiones van a `http://localhost:3000`
- [ ] ✅ Sin errores de CORS

### 6.3 - Authorization Header
En DevTools → Network → cualquier petición a expenses/categories:
- [ ] ✅ Header `Authorization: Bearer <token>` presente
- [ ] ✅ Response code 200 (no 401)

---

## 📊 Backend Logs

En la terminal del backend, deberías ver:
```
2026-04-14T10:30:45.123Z - POST /api/v1/auth/login
2026-04-14T10:30:46.456Z - GET /api/v1/expenses
2026-04-14T10:30:47.789Z - GET /api/v1/categories
```

- [ ] Los logs aparecen al interactuar con la app
- [ ] No hay errores (500) en los logs

---

## 🎉 ¡TODO OK?

Si marcaste ✅ en TODO, ¡felicidades! Tu aplicación está funcionando correctamente.

### Ahora puedes:
1. Continuar desarrollando nuevas funcionalidades
2. Deployar a producción
3. Invitar usuarios a probar

### Si encuentras problemas:
1. Abre **BACKEND_SETUP.md** sección "Troubleshooting"
2. Revisa **QUICK_START.md** para debug
3. Verifica los logs del backend y frontend

---

## 📝 Notas Finales

- **No commitear** `.env` ni `.env.local` (ya están en .gitignore)
- **Cambiar JWT_SECRET** antes de ir a producción
- **Usar HTTPS** en producción
- **Hacer backup** de la base de datos regularmente

---

**¡Buena suerte con el proyecto! 🚀**
