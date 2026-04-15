# Sistema de Control de Gastos Diarios — Arquitectura Completa

## Índice
1. [Visión general](#1-visión-general)
2. [Componentes del sistema](#2-componentes-del-sistema)
3. [Flujo completo de datos](#3-flujo-completo-de-datos)
4. [Modelo de base de datos](#4-modelo-de-base-de-datos)
5. [Roles y permisos](#5-roles-y-permisos)
6. [Lógica de negocio](#6-lógica-de-negocio)
7. [Páginas y funcionalidad](#7-páginas-y-funcionalidad)
8. [Diseño UX/UI](#8-diseño-uxui)
9. [Integración n8n](#9-integración-n8n)
10. [Seguridad](#10-seguridad)
11. [MVP vs Versión escalable](#11-mvp-vs-versión-escalable)
12. [Riesgos y recomendaciones](#12-riesgos-y-recomendaciones)

---

## 1. Visión general

Un sistema de control de gastos donde los usuarios registran gastos diarios
principalmente por WhatsApp (texto, audio o imagen), y pueden consultarlos
desde una PWA móvil. Un administrador supervisa todo el sistema desde un
dashboard de escritorio en Appsmith.

### Principios de diseño
- **Mínimo esfuerzo para el usuario final** — enviar un mensaje de WhatsApp es suficiente
- **Control total para el admin** — puede ver, corregir y reprocesar cualquier registro
- **Datos siempre íntegros** — se guarda el mensaje original antes de interpretarlo
- **Fallo gracioso** — si la IA no entiende el mensaje, queda pendiente, no se pierde

---

## 2. Componentes del sistema

```
┌─────────────────────────────────────────────────────────────────┐
│  USUARIO FINAL                    ADMINISTRADOR                  │
│  WhatsApp → envia mensaje         Appsmith → dashboard completo  │
│  PWA → consulta y carga manual    Appsmith → corrige, configura  │
└──────────┬────────────────────────────────┬─────────────────────┘
           │                                │
           ▼                                ▼
┌──────────────────┐              ┌──────────────────────┐
│   n8n            │              │   Appsmith           │
│  Orquestador     │              │   Admin Dashboard    │
│  ─────────────── │              │  (desktop-first)     │
│  • Recibe        │◄─────────────│  • Lee/escribe vía   │
│    WhatsApp      │  PostgreSQL  │    PostgreSQL directo │
│  • Transcribe    │              └──────────────────────┘
│    audio (STT)   │
│  • Analiza foto  │              ┌──────────────────────┐
│    (Vision AI)   │              │   PWA Móvil          │
│  • Llama IA para │◄─────────────│  (React + Vite)      │
│    interpretar   │  n8n webhook │  • Dashboard personal│
│  • Guarda en BD  │              │  • Cargar gasto      │
│  • Responde al   │              │  • Ver historial     │
│    usuario       │              │  • Corregir pending  │
└──────────┬───────┘              └──────────────────────┘
           │
           ▼
┌──────────────────┐
│   PostgreSQL     │
│   Base de datos  │
│  ─────────────── │
│  users           │
│  messages        │
│  expenses        │
│  categories      │
│  audit_log       │
└──────────────────┘
```

### Responsabilidades por componente

| Componente   | Hace | No hace |
|--------------|------|---------|
| **n8n**      | Recibe WhatsApp, transcribe audio, analiza imágenes, interpreta gasto con IA, guarda en PostgreSQL, responde al usuario | Autenticación de usuarios, UI |
| **PostgreSQL** | Almacena todo, enforcea integridad referencial, vistas, índices | Lógica de negocio |
| **Appsmith** | Dashboard admin, CRUD completo, corrección manual, reportes | Procesamiento de mensajes |
| **PWA**      | Dashboard personal, carga manual, ver historial, corregir pendientes | Procesamiento pesado, admin |
| **Auth (n8n webhook)** | Valida credenciales, emite JWT | — |

---

## 3. Flujo completo de datos

### 3.1 Mensaje de texto desde WhatsApp

```
Usuario envía: "Gasté 3500 en comida"
        │
        ▼
[WhatsApp Business API / Meta]
        │  webhook HTTP POST
        ▼
[n8n: Webhook Trigger]
        │
        ├─► Identificar usuario por número de teléfono
        │   ┌── phone en tabla users → user_id
        │   └── Si no existe → crear usuario con status='unregistered'
        │
        ├─► INSERT messages (raw_text, user_id, message_type='text',
        │                    processing_status='pending')
        │
        ├─► Llamar IA (Claude/GPT) con prompt de extracción:
        │   "Extrae del texto: monto, categoría, descripción, fecha.
        │    Devuelve JSON con confidence_score 0-1."
        │
        ├─► Evaluar confidence_score:
        │   ├── >= 0.85 → INSERT expenses (status='confirmed')
        │   │             UPDATE messages (processing_status='processed')
        │   │             Responder al usuario: "✅ Registré L3,500 en Comida"
        │   │
        │   ├── 0.50-0.84 → INSERT expenses (status='pending')
        │   │               UPDATE messages (processing_status='processed')
        │   │               Responder: "⚠️ Registré L3,500 (revisar categoría)"
        │   │
        │   └── < 0.50 → INSERT expenses (status='incomplete') o no insertar
        │                UPDATE messages (processing_status='error',
        │                                error_reason='...')
        │                Responder: "❓ No pude interpretar tu gasto. Revísalo en la app."
        │
        └─► INSERT audit_log (action='create_from_whatsapp', ...)
```

### 3.2 Audio desde WhatsApp

```
Usuario envía: 🎤 audio
        │
        ▼
[n8n: detecta message_type='audio']
        │
        ├─► Descargar archivo de audio (URL temporal de WhatsApp API)
        ├─► Enviar a Whisper API (OpenAI) → transcripción de texto
        ├─► INSERT messages (raw_text=transcripción, message_type='audio',
        │                    raw_content=url_original)
        │
        └─► [continúa igual que flujo de texto] ──►
```

### 3.3 Imagen desde WhatsApp

```
Usuario envía: 📷 foto de ticket
        │
        ▼
[n8n: detecta message_type='image']
        │
        ├─► Descargar imagen
        ├─► Enviar a Vision AI (GPT-4o o Claude Vision):
        │   "Analiza este ticket. Extrae: total, comercio, fecha, items.
        │    Si no puedes, indica qué datos faltan."
        │
        ├─► INSERT messages (message_type='image', raw_content=url,
        │                    raw_text=respuesta_vision)
        │
        └─► [continúa igual que flujo de texto] ──►
```

### 3.4 Carga manual desde PWA/Appsmith

```
Usuario llena formulario → POST /webhook/expenses/create
        │
        ▼
[n8n webhook o directo a PostgreSQL]
        │
        ├─► INSERT expenses (user_id, category_id, amount, ...,
        │                    capture_channel='manual',
        │                    status='confirmed',
        │                    confidence_score=1.0)
        │
        └─► No se crea registro en messages (message_id = NULL)
```

---

## 4. Modelo de base de datos

### Diagrama de relaciones

```
users ──────────────────────────────────────┐
  │                                         │
  │ 1:N                                     │ 1:N
  ▼                                         ▼
messages                                  expenses
  │                                         │
  │ 1:1 (opcional)                          │ N:1
  └─────────────────────────────────────────┘
                                            │ N:1
                                            ▼
                                         categories

audit_log (registro de toda acción)
```

### Tabla: users

| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| phone | VARCHAR(30) UNIQUE | número con código de país, ej: +50412345678 |
| name | VARCHAR(150) | |
| email | VARCHAR(200) UNIQUE NULL | |
| password_hash | VARCHAR(255) NULL | NULL si solo usa WhatsApp |
| role | VARCHAR(20) | 'admin' \| 'user' |
| status | VARCHAR(20) | 'active' \| 'inactive' \| 'unregistered' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Tabla: messages

| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users.id | |
| channel_message_id | VARCHAR(100) NULL | ID único de WhatsApp |
| message_type | VARCHAR(20) | 'text' \| 'audio' \| 'image' \| 'document' |
| raw_text | TEXT NULL | texto original o transcripción |
| raw_content | TEXT NULL | URL del audio/imagen descargado |
| processing_status | VARCHAR(20) | 'pending' \| 'processed' \| 'error' \| 'reviewed' |
| error_reason | TEXT NULL | descripción del error |
| processed_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ | |

### Tabla: categories

| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(100) UNIQUE | |
| color | VARCHAR(7) | hex color |
| icon | VARCHAR(10) | emoji |
| is_active | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### Tabla: expenses

| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users.id | |
| message_id | INTEGER FK → messages.id NULL | NULL si es manual |
| category_id | INTEGER FK → categories.id NULL | |
| amount | NUMERIC(12,2) | |
| payment_method | VARCHAR(30) NULL | 'cash' \| 'card' \| 'transfer' \| 'other' |
| description | TEXT NULL | |
| expense_date | DATE | |
| status | VARCHAR(20) | 'confirmed' \| 'pending' \| 'incomplete' \| 'error' |
| capture_channel | VARCHAR(20) | 'whatsapp' \| 'manual' \| 'appsmith' |
| confidence_score | NUMERIC(4,3) NULL | 0.000 - 1.000 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### Tabla: audit_log

| Campo | Tipo | Notas |
|-------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK NULL | quién ejecutó la acción |
| entity_type | VARCHAR(50) | 'expense' \| 'message' \| 'user' \| 'category' |
| entity_id | INTEGER | ID del registro afectado |
| action | VARCHAR(50) | 'create' \| 'update' \| 'delete' \| 'review' |
| old_values | JSONB NULL | snapshot antes del cambio |
| new_values | JSONB NULL | snapshot después del cambio |
| created_at | TIMESTAMPTZ | |

### Índices clave

```sql
CREATE INDEX idx_expenses_user_date    ON expenses (user_id, expense_date DESC);
CREATE INDEX idx_expenses_status       ON expenses (status);
CREATE INDEX idx_expenses_category     ON expenses (category_id);
CREATE INDEX idx_messages_user         ON messages (user_id, created_at DESC);
CREATE INDEX idx_messages_status       ON messages (processing_status);
CREATE INDEX idx_audit_entity          ON audit_log (entity_type, entity_id);
```

---

## 5. Roles y permisos

### Matriz de acceso

| Acción | Usuario normal | Administrador |
|--------|----------------|---------------|
| Ver sus propios gastos | ✅ | ✅ |
| Ver gastos de otros usuarios | ❌ | ✅ |
| Crear gasto manual propio | ✅ | ✅ |
| Crear gasto para otro usuario | ❌ | ✅ |
| Editar su propio gasto | ✅ (solo pending/error) | ✅ siempre |
| Editar gasto de otro | ❌ | ✅ |
| Eliminar gasto | ❌ | ✅ |
| Ver mensajes propios | ✅ | ✅ |
| Ver mensajes de todos | ❌ | ✅ |
| Crear gasto desde mensaje | Solo los propios | ✅ todos |
| Administrar categorías | ❌ | ✅ |
| Administrar usuarios | ❌ | ✅ |
| Ver dashboard global | ❌ | ✅ |
| Ver dashboard personal | ✅ | ✅ |

### Implementación de permisos

**En la PWA (frontend):**
- JWT contiene `{ user_id, role, name }` como claims
- Rutas protegidas verifican JWT en cada carga
- Componentes que muestran opciones admin se renderizan solo si `role === 'admin'`
- Todas las peticiones incluyen `Authorization: Bearer <token>`

**En n8n (API backend):**
- Cada webhook verifica el JWT antes de procesar
- Las queries SQL incluyen `WHERE user_id = $1` excepto para admin
- Admin pasa `user_id = NULL` para ver todo

**En Appsmith (admin):**
- Appsmith se considera una herramienta solo para administradores
- La credencial de base de datos tiene acceso completo
- La autenticación de Appsmith maneja quién puede acceder a la herramienta

---

## 6. Lógica de negocio

### Estados del gasto y transiciones

```
(entrada desde WhatsApp o manual)
         │
         ▼
    [confidence_score]
    >= 0.85 ──────────────► CONFIRMED ◄──── (admin corrige manualmente)
    0.50-0.84 ────────────► PENDING ────────────────────┐
    < 0.50 ───────────────► INCOMPLETE                  │
    error de sistema ─────► ERROR ──────────────────────┤
                                                         │
                            (usuario o admin revisa)     │
                                     │                   │
                                     ▼                   ▼
                               CONFIRMED ◄───────────────┘
```

### Reglas de negocio principales

1. **Un gasto SIN monto no puede tener status=confirmed.** Debe quedar en incomplete.
2. **La fecha por defecto es el día del mensaje** si no se detecta otra.
3. **Un mensaje puede generar 0 o 1 gasto.** Si el mismo mensaje genera múltiples gastos, se crean múltiples registros de expense todos con el mismo message_id.
4. **Un gasto manual** siempre tiene `confidence_score = 1.0`, `capture_channel = 'manual'`, `message_id = NULL`.
5. **Editar un gasto confirmed** requiere ser admin o ser el propietario si el gasto tiene < 24 horas.
6. **Eliminar un gasto** solo puede hacerlo el admin. El usuario puede marcarlo como error.
7. **confidence_score** es informativo — el admin puede confirmar un gasto con score bajo.

### Interpretación IA — prompt base

```
Eres un asistente de finanzas personales.
Dado el siguiente texto: "{mensaje}"
Extrae estos campos en JSON:
{
  "amount": número o null,
  "description": texto breve o null,
  "category_guess": una de [Alimentación, Transporte, Servicios, Salud, 
                            Entretenimiento, Ropa, Hogar, Educación, Otros],
  "expense_date": "YYYY-MM-DD" o null (usa hoy si no se menciona),
  "payment_method": "cash"|"card"|"transfer"|"other"|null,
  "confidence_score": número entre 0 y 1,
  "confidence_reason": explicación breve
}
Responde SOLO con el JSON, sin texto adicional.
```

---

## 7. Páginas y funcionalidad

### 7.1 Login

**Actores:** Usuario y Admin
**Ruta:** `/login`

Flujo:
1. Usuario ingresa email/teléfono + contraseña
2. PWA hace POST al webhook `/auth/login` de n8n
3. n8n busca usuario en PostgreSQL, valida `password_hash` con bcrypt
4. Si válido: genera JWT con `{ user_id, role, name, exp }`, responde 200
5. PWA guarda JWT en `localStorage` y redirige a `/`
6. Si inválido: muestra error "Credenciales incorrectas"

Componentes:
- Logo / nombre de la app
- Campo email o teléfono
- Campo contraseña (con toggle mostrar/ocultar)
- Botón Ingresar
- No mostrar enlace de registro (el admin crea los usuarios)

### 7.2 Dashboard

**Actores:** Usuario (personal) y Admin (global)
**Ruta:** `/`

**KPIs superiores (tarjetas):**
- Total gastado en el mes
- Cantidad de movimientos
- Promedio por gasto
- Mensajes pendientes/con error (solo si es admin o tiene propios)

**Gráficos:**
- Barras: gasto diario de los últimos 30 días
- Torta: distribución por categoría del mes
- Línea: comparativa mes actual vs mes anterior (versión escalable)

**Tabla inferior:** últimos 10 movimientos con columnas: fecha, descripción, categoría, monto, estado, canal

**Filtros del dashboard:**
- Selector de mes/año
- Si es admin: selector de usuario (o "Todos")
- Categoría (multi-select)

### 7.3 Movimientos

**Actores:** Usuario (solo suyos) y Admin (todos)
**Ruta:** `/movimientos`

**Filtros:**
- Rango de fechas (desde/hasta)
- Categoría (multi-select)
- Estado (confirmed / pending / incomplete / error)
- Canal (whatsapp / manual / appsmith)
- Búsqueda de texto en description
- Si es admin: selector de usuario

**Tabla:**

| # | Fecha | Descripción | Categoría | Monto | Estado | Canal | Acciones |
|---|-------|-------------|-----------|-------|--------|-------|----------|
| 1 | 12 abr | Almuerzo trabajo | 🍔 Alimentación | L 3,500 | ✅ confirmed | 💬 WA | ✏️ |
| 2 | 12 abr | — | — | — | ⚠️ pending | 💬 WA | ✏️ |

Acciones por fila:
- Editar (abre modal lateral)
- Ver mensaje original (si vino de WhatsApp)
- Eliminar (solo admin)

**Modal de edición:**
- Monto
- Categoría (select)
- Descripción
- Fecha
- Método de pago
- Estado (admin puede cambiar a confirmed)
- Botón Guardar → actualiza BD + INSERT audit_log

### 7.4 Nuevo Gasto

**Actores:** Ambos
**Ruta:** `/gastos/nuevo`

Formulario:
- Usuario (si es admin, selector; si es usuario normal, fijo en él mismo)
- Monto (input numérico con moneda)
- Categoría (grid de chips con icono)
- Descripción (textarea opcional)
- Fecha (datepicker, default hoy)
- Método de pago (select: efectivo/tarjeta/transferencia/otro)

Al guardar:
- POST → webhook n8n `/expenses/create`
- `confidence_score = 1.0`, `capture_channel = 'manual'`, `status = 'confirmed'`
- Redirige a /movimientos con toast de éxito

### 7.5 Mensajes

**Actores:** Usuario (solo suyos) y Admin (todos)
**Ruta:** `/mensajes`

**Tabla:**

| Fecha | Tipo | Mensaje original | Estado | Gasto generado | Acciones |
|-------|------|-----------------|--------|----------------|----------|
| 12 abr 10:30 | 💬 texto | "Gasté 3500 en comida" | ✅ procesado | L 3,500 Alimentación | 👁 |
| 12 abr 11:00 | 🎤 audio | "[transcripción]" | ⚠️ error | — | ✏️ crear gasto |
| 12 abr 14:00 | 📷 imagen | "[análisis IA]" | ⚠️ pendiente | L ?, sin categoría | ✏️ completar |

Acciones por fila:
- Ver detalle (expandir con raw_text completo + respuesta IA)
- Crear gasto desde mensaje (abre formulario prellenado)
- Reprocesar (solo admin) → reenvía a n8n para nuevo intento

**Barra de estados:** contador de pending + error para alertar al admin

### 7.6 Categorías

**Actores:** Solo Admin
**Ruta:** `/categorias`

Grid de tarjetas con:
- Icono (emoji editable)
- Nombre
- Color (swatch)
- Cantidad de gastos asociados
- Botón Editar / Desactivar

Panel lateral de creación/edición:
- Nombre
- Icono (picker de emojis común)
- Color (color picker hex)
- Toggle activo/inactivo

Regla: no se puede eliminar una categoría con gastos asociados. Solo desactivar.

### 7.7 Usuarios

**Actores:** Solo Admin
**Ruta:** `/usuarios`

**Tabla:**

| ID | Nombre | Teléfono | Email | Rol | Estado | Gastos | Último gasto | Acciones |
|----|--------|----------|-------|-----|--------|--------|-------------|----------|

Acciones:
- Crear usuario (nombre, teléfono, email, rol, contraseña inicial)
- Editar
- Desactivar (no eliminar — perderíamos histórico)
- Ver gastos del usuario (link a /movimientos?user_id=X)

### 7.8 Mi Cuenta

**Actores:** Ambos
**Ruta:** `/perfil`

Secciones:
- Datos personales (nombre, email, teléfono) — editable
- Cambiar contraseña (actual → nueva → confirmar)
- Resumen rápido: total de gastos, meses registrado
- Botón Cerrar sesión (limpia localStorage)

---

## 8. Diseño UX/UI

### Estructura visual

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR (260px fijo en desktop, drawer en móvil)    │
│  🏷 Logo / nombre app                               │
│  ──────────────────                                  │
│  🏠 Dashboard                                        │
│  📋 Movimientos                                      │
│  ➕ Nuevo Gasto                                      │
│  💬 Mensajes         [3] ← badge de pendientes      │
│  ─────── (solo admin) ──────────────────             │
│  🏷 Categorías                                       │
│  👥 Usuarios                                         │
│  ──────────────────                                  │
│  👤 Mi Cuenta                                        │
│  🚪 Cerrar sesión                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ HEADER DE PÁGINA                                     │
│  Título de página    [filtros rápidos]  [acciones]  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ÁREA PRINCIPAL                                       │
│                                                      │
│  [KPI] [KPI] [KPI] [KPI]                            │
│                                                      │
│  ┌────────────────┐  ┌──────────────────────┐       │
│  │  Gráfico 1     │  │  Gráfico 2           │       │
│  └────────────────┘  └──────────────────────┘       │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │  Tabla de datos                          │       │
│  └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Paleta de colores

| Elemento | Color | Uso |
|----------|-------|-----|
| Primary | `#6366f1` (indigo) | Botones principales, sidebar activo |
| Success | `#22c55e` | status confirmed, badges positivos |
| Warning | `#f59e0b` | status pending |
| Error | `#ef4444` | status error/incomplete |
| Neutral dark | `#1e293b` | texto principal |
| Neutral mid | `#64748b` | texto secundario, labels |
| Background | `#f8fafc` | fondo general |
| Surface | `#ffffff` | tarjetas, modales |
| Border | `#e2e8f0` | separadores, bordes |

### Tipografía
- Fuente: `Inter` (system-safe, libre, legible en tablas)
- Títulos de sección: 20px / semibold
- Labels de KPI: 14px / medium / neutral-mid
- Valores de KPI: 32px / bold
- Texto de tabla: 14px / regular

### Componentes reutilizables

**KPI Card:**
```
┌──────────────────────────────┐
│ L 42,500.00                  │
│ Total del mes        [📈 +8%]│
│ ─────────────────────────── │
│ Vs mes anterior: L 39,200   │
└──────────────────────────────┘
```

**Estado badge:**
- `confirmed` → verde, fondo verde claro, texto "Confirmado"
- `pending` → amarillo, "Pendiente"
- `incomplete` → naranja, "Incompleto"
- `error` → rojo, "Error"

**Canal badge:**
- `whatsapp` → verde WhatsApp 💬
- `manual` → gris, ✍️
- `appsmith` → indigo, 🖥

---

## 9. Integración n8n

### Workflows a crear

| Workflow | Trigger | Descripción |
|----------|---------|-------------|
| WA Texto | Webhook WhatsApp | Procesa mensajes de texto |
| WA Audio | Webhook WhatsApp | Descarga, transcribe, procesa |
| WA Imagen | Webhook WhatsApp | Descarga, Vision AI, procesa |
| Auth Login | POST /auth/login | Valida credenciales, emite JWT |
| API Gastos GET | GET /api/expenses | Lista gastos con filtros |
| API Gastos POST | POST /api/expenses | Crea gasto manual |
| API Gastos PUT | PUT /api/expenses/:id | Edita gasto |
| API Gastos DELETE | DELETE /api/expenses/:id | Elimina (admin) |
| API Mensajes GET | GET /api/messages | Lista mensajes |
| API Resumen GET | GET /api/summary | Dashboard stats |
| API Categorías CRUD | * /api/categories | CRUD categorías |
| API Usuarios CRUD | * /api/users | CRUD usuarios (admin) |
| Reprocesar mensaje | POST /api/messages/:id/reprocess | Reenvía a IA |

### Estructura del nodo de autenticación (en cada webhook API)

```javascript
// Código JavaScript en n8n — primer nodo de cada workflow API
const auth = $input.first().json.headers.authorization || '';
const token = auth.replace('Bearer ', '');

if (!token) throw new Error('No token');

// Verificar JWT
const jwt = require('jsonwebtoken');
const payload = jwt.verify(token, process.env.JWT_SECRET);

// Inyectar en el contexto
return [{ json: { ...payload, ...($input.first().json) } }];
```

### Variables de entorno requeridas en n8n

```env
JWT_SECRET=cadena-secreta-larga-y-aleatoria
OPENAI_API_KEY=sk-...
WHATSAPP_TOKEN=...
WHATSAPP_PHONE_ID=...
DB_HOST=postgres
DB_NAME=gastos
DB_USER=...
DB_PASS=...
```

---

## 10. Seguridad

### Autenticación
- Contraseñas hasheadas con **bcrypt** (cost factor 12)
- JWT con expiración de **8 horas**
- Refresh token opcional para MVP+
- No almacenar contraseña plana ni en logs

### Autorización
- Cada endpoint n8n verifica JWT antes de ejecutar SQL
- Las queries SQL de usuario normal SIEMPRE incluyen `WHERE user_id = $jwt.user_id`
- Las queries admin no tienen esa restricción pero igual validan que el JWT tenga `role = 'admin'`

### Base de datos
- Usuario de PostgreSQL con mínimos privilegios necesarios
- n8n usa un usuario con SELECT/INSERT/UPDATE en tablas de negocio
- Solo el usuario admin de n8n puede hacer DELETE
- Backups diarios automatizados (cron en EasyPanel)

### Otros
- Rate limiting en webhooks públicos de WhatsApp (n8n throttle)
- Validar que el número de WhatsApp entrante no esté bloqueado
- Sanitizar inputs antes de insertar en SQL (usar queries parametrizadas)
- CORS configurado en nginx para aceptar solo el dominio de la PWA

---

## 11. MVP vs Versión escalable

### MVP — semana 1-2

**Objetivo:** sistema funcional para 1-5 usuarios reales

Incluye:
- ✅ Schema completo de BD
- ✅ Flujo WhatsApp texto → gasto (IA básica)
- ✅ Login con JWT
- ✅ Dashboard personal (KPIs + últimos movimientos)
- ✅ Página Movimientos (tabla + filtro básico)
- ✅ Nuevo Gasto manual
- ✅ Página Mensajes (solo lectura)
- ✅ Appsmith: Dashboard admin + Movimientos admin + Categorías + Usuarios
- ✅ Deploy en EasyPanel (PWA + n8n + PostgreSQL)

**No incluye en MVP:**
- Audio e imágenes desde WhatsApp
- Corrección inline desde mensajes
- Exportación CSV
- Auditoría completa
- Reprocesamiento

### Versión escalable — mes 2-3

Añadir:
- 🔶 Flujo WhatsApp audio (Whisper STT)
- 🔶 Flujo WhatsApp imagen (Vision AI)
- 🔶 Reprocesamiento manual de mensajes
- 🔶 Corrección rápida desde la página de mensajes
- 🔶 Exportación CSV/Excel
- 🔶 Comparativa mes a mes en dashboard
- 🔶 Alertas: si no registra gastos en 3 días, WhatsApp recuerda
- 🔶 Dashboard avanzado: tasa de error, gastos por canal, automatización %
- 🔶 Perfil de usuario editable
- 🔶 Multi-moneda
- 🔶 Categorías automáticas con ML (basado en historial)
- 🔶 Audit log visible desde Appsmith
- 🔶 Refresh token / sesión persistente
- 🔶 Notificaciones push en PWA

---

## 12. Riesgos y recomendaciones

### Riesgos técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| IA interpreta mal montos con comas/puntos | Alta | Medio | Normalizar el texto antes de enviar a IA |
| Usuario envía mensaje en otro idioma | Media | Bajo | Prompt multi-idioma, configurar idioma por defecto |
| WhatsApp cambia su API | Baja | Alto | Abstraer la capa de WhatsApp en un solo nodo |
| Un número de WhatsApp = varios usuarios | Media | Alto | Implementar multi-usuario por número con comandos ("soy Pedro") |
| BD crece sin control (mensajes con imágenes) | Media | Medio | No guardar binarios en BD, solo URLs; purge periódico |
| JWT sin invalidación activa | Media | Medio | Usar lista negra de tokens o expiración corta |

### Recomendaciones de implementación

1. **Empezar con texto antes que audio/imagen** — el ROI de texto es inmediato y más fácil de debuggear
2. **Guardar el mensaje RAW siempre**, incluso si el procesamiento falla — no perder datos
3. **Probar el prompt de extracción con 20+ ejemplos reales** antes de hacer deploy
4. **El dashboard de admin es crítico** — si el admin no puede corregir errores fácilmente, el sistema pierde confianza
5. **Implementar audit_log desde el día 1** — es barato de hacer y valioso para debugging
6. **No usar CASCADE DELETE** en FK — un error borra datos irrecuperables
7. **Configurar alertas de n8n** para cuando un workflow falla — el admin debe saber si los mensajes no se procesan
8. **Hacer backup del schema SQL** en git — si se cae el servidor, la BD se puede reconstituir rápidamente
