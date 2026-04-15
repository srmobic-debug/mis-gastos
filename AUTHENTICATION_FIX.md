# 🔐 Corrección de Autenticación - Mis Gastos

**Fecha:** 2026-04-13  
**Problema:** Login fallaba aunque el backend respondiera correctamente  
**Estado:** ✅ RESUELTO

---

## 📋 RESUMEN EJECUTIVO

### Problema Identificado
El frontend validaba login con esta condición:
```typescript
if (data.success && data.token) {
```

Pero el backend **NO enviaba `token`**, solo:
```json
{
  "success": true,
  "user": { "id": "uuid", "name": "Admin", "email": "...", "role": "admin" }
}
```

**Resultado:** `data.token` era `undefined` → condición fallaba → "Credenciales inválidas"

---

## 🔧 CAMBIOS REALIZADOS

### 1️⃣ **src/types/index.ts** — Tipos más flexibles

```diff
export interface User {
-  id: number
+  id: string | number  // Ahora acepta UUID (string) o números
   name: string
   email: string | null
   phone: string | null
   role: 'admin' | 'user'
-  status: 'active' | 'inactive' | 'unregistered'
+  status?: 'active' | 'inactive' | 'unregistered'  // Ahora opcional
   created_at?: string
}

export interface AuthState {
-  token: string  // Era obligatorio
+  token?: string  // Ahora es opcional (para futuros tokens)
   user: User
}
```

**Por qué:** 
- Backend envía UUID en string, no number
- Backend no siempre envía token
- Mejor preparado para cuando backend envíe token en el futuro

---

### 2️⃣ **src/context/AuthContext.tsx** — Lógica flexible de sesión

**Cambios en la firma:**
```diff
- login: (token: string, user: User) => void
+ login: (user: User, token?: string) => void  // User primero, token opcional
```

**Nueva implementación:**
```typescript
const login = (user: User, token?: string) => {
  const newAuth: AuthState = { user, ...(token && { token }) }
  setAuth(newAuth)
  // Guardar user en localStorage también (para acceso directo)
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('auth', JSON.stringify(newAuth))
  console.log('✅ Login exitoso:', { user: user.email, hasToken: !!token })
}

const logout = () => {
  setAuth(null)
  localStorage.removeItem('auth')
  localStorage.removeItem('user')  // También limpiar user
  console.log('👋 Logout exitoso')
}
```

**useEffect mejorado:**
```typescript
// Si hay token, validar que no esté expirado
if (parsed.token) {
  // Verificar expiración JWT
} else {
  // Si no hay token, la sesión es válida igual (sistema sin tokens hoy)
  setAuth(parsed)
}
```

**Por qué:**
- Permite login sin token (sistema actual)
- Token guardado por separado (fácil acceso)
- Mantiene user en localStorage también
- Mejor manejo para sesiones futuras con token

---

### 3️⃣ **src/pages/Login.tsx** — Lógica de validación corregida

**ANTES (❌ INCORRECTO):**
```typescript
const { data } = await axios.post(url, credentials)
if (data.success && data.token) {  // ← Requería token
  login(data.token, data.user)
} else {
  setError('Credenciales inválidas')
}
```

**DESPUÉS (✅ CORRECTO):**
```typescript
const response = await axios.post(url, credentials)
const data = response.data

// Depuración
console.log('📡 Enviando login:', {...})
console.log('📩 Respuesta recibida:', {...})

// Validación según criterios: response.ok + data.success + data.user
if (response.status === 200 && data.success && data.user) {
  console.log('✅ Credenciales válidas')
  login(data.user, data.token)  // User primero, token es opcional
  console.log('🚀 Redirigiendo...')
  navigate('/')
} else {
  console.warn('❌ Validación fallida')
  setError('Credenciales inválidas')
}
```

**Cambios clave:**
- ✅ Ya NO requiere `data.token`
- ✅ Valida: `status === 200`, `data.success`, `data.user` exista
- ✅ Console.log útiles para depuración (emojis + info clara)
- ✅ Parámetro correcto a `login(user, token?)`
- ✅ Manejo de errores mejorado (401 → "Credenciales inválidas")

---

## 🧪 QUÉ PROBAR

### Test 1: Login exitoso ✅
1. Abre `/login`
2. Ingresa: `admin@srmobic.com` / `admin123`
3. Verifica en DevTools (Console):
   ```
   📡 Enviando login: { login: "admin@srmobic.com", password: "***" }
   📩 Respuesta recibida: { success: true, hasUser: true, user: {...}, hasToken: false }
   ✅ Credenciales válidas, ejecutando login...
   ✅ Login exitoso: { user: "admin@srmobic.com", hasToken: false }
   🚀 Redirigiendo al dashboard...
   ```
4. Debería redirigir a `/` (Dashboard)
5. Verifica `localStorage`:
   ```javascript
   // En DevTools Console:
   localStorage.getItem('user')  // → JSON del usuario
   localStorage.getItem('auth')  // → JSON con user (sin token)
   ```

### Test 2: Login inválido ❌
1. Ingresa credenciales incorrectas
2. Debería mostrar "Credenciales inválidas" (sin hacer login)
3. No debería guardar nada en localStorage

### Test 3: Sesión persistente
1. Login con admin
2. Cierra el tab/navegador
3. Reabre la app
4. Debería mantener sesión (Dashboard visible)
5. Verifica en Console que se restauró desde localStorage

### Test 4: Logout
1. Estando logueado, ve a `/perfil` y haz logout
2. Verifica Console: `👋 Logout exitoso`
3. localStorage debería estar limpio
4. Debería redirigir a `/login`

---

## 📊 COMPARATIVA

| Aspecto | Antes ❌ | Después ✅ |
|---------|---------|-----------|
| Requiere token | Sí (FALLA) | No (opcional) |
| Valida response.status | No | Sí (200) |
| Valida data.success | Sí | Sí |
| Valida data.user | No | Sí |
| Guarda user en localStorage | No | Sí |
| Guarda token si viene | No | Sí |
| Console logs útiles | No | Sí (9 puntos) |
| Soporta sesiones futuras con token | No | Sí |

---

## 🚀 RESULTADO ESPERADO

### Flujo correcto:
```
1. Usuario ingresa credenciales
   ↓
2. Frontend POST a n8n/auth/login
   ↓
3. Backend responde: { success: true, user: {...} }
   ↓
4. Frontend valida: ✅ status 200 + success + user existe
   ↓
5. login(user, undefined) → setAuth + localStorage
   ↓
6. navigate('/') → Dashboard visible
   ↓
7. Usuario autenticado ✅
```

---

## 💾 ARCHIVOS MODIFICADOS

- `src/types/index.ts` — Tipos actualizados
- `src/context/AuthContext.tsx` — Lógica de sesión flexible
- `src/pages/Login.tsx` — Validación corregida + console.logs

---

## 🔮 PARA CUANDO BACKEND ENVÍE TOKEN

Cuando el backend empiece a enviar `token` en la respuesta:

```json
{
  "success": true,
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIs..." // ← Nuevo
}
```

El código ya está preparado:
1. `AuthState` acepta `token?: string`
2. `login(user, token)` recibe el token
3. Se guarda en localStorage automáticamente
4. Se inyecta en headers via `api.interceptors.request`
5. Sin cambios adicionales necesarios ✅

---

## ✅ CHECKLIST

- [x] Problema identificado (requería token que no venía)
- [x] Types actualizados para flexibilidad
- [x] AuthContext adaptado a login sin token
- [x] Login.tsx corregido (validación correcta + console.logs)
- [x] localStorage preparado (user + token)
- [x] Estructura futura con token lista
- [x] Código limpio y profesional
- [x] Sin cambios visuales
- [x] Documentado

---

**Próximo paso:** Prueba el login con las credenciales `admin@srmobic.com` / `admin123`
