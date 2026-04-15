# PWA Control de Gastos

Aplicación móvil (PWA) para control de gastos diarios con autenticación JWT, conexión a n8n webhooks y base de datos PostgreSQL.

## 🚀 Quick Start

### Instalación de dependencias
```bash
npm install
```

### Desarrollo local
```bash
npm run dev
```
Abre `http://localhost:5173` en tu navegador.

### Build para producción
```bash
npm run build
```
Los archivos optimizados quedan en `dist/`

### Preview build
```bash
npm run preview
```

---

## ⚙️ Configuración

### Variables de entorno

Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

Configura la URL base de n8n:
```env
VITE_N8N_URL=https://n8n.srmobic.com/webhook
```

> **Nota**: Las variables con prefijo `VITE_` son inyectadas en build-time por Vite y están disponibles en el cliente.

---

## 📱 Páginas

1. **Login** (`/login`) — Autenticación con email/teléfono + contraseña
2. **Dashboard** (`/`) — Resumen: KPIs, gráficos, últimos movimientos
3. **Movimientos** (`/movimientos`) — Tabla de gastos con filtros y edición inline
4. **Agregar Gasto** (`/gastos/nuevo`) — Formulario manual con selector de categoría
5. **Mensajes** (`/mensajes`) — Bandeja de mensajes WhatsApp + crear gasto desde mensaje
6. **Categorías** (`/categorias`) — CRUD de categorías (admin)
7. **Usuarios** (`/usuarios`) — Gestión de usuarios (admin)
8. **Perfil** (`/perfil`) — Mi cuenta, cambiar contraseña, logout

---

## 🔌 APIs (n8n webhooks)

La PWA se conecta a estos endpoints de n8n:

```
POST   /auth/login              — Login (email/phone + password)
GET    /categories              — Listar categorías activas
GET    /expenses?mes=...        — Listar gastos (con filtros)
POST   /expenses                — Crear gasto
PUT    /expenses/:id            — Editar gasto
DELETE /expenses/:id            — Eliminar gasto
GET    /resume?mes=...          — KPIs y resumen mensual
GET    /messages                — Listar mensajes WhatsApp
POST   /expenses/from-message   — Crear gasto desde mensaje
GET    /users                   — Listar usuarios (admin)
```

---

## 🐳 Docker

### Build imagen
```bash
docker build \
  --build-arg VITE_N8N_URL=https://n8n.srmobic.com/webhook \
  -t pwa-gastos:latest .
```

### Ejecutar contenedor
```bash
docker run -p 8080:80 pwa-gastos:latest
```

Abre `http://localhost:8080`

---

## 📦 Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool (fast, modern)
- **Tailwind CSS** — Estilos
- **React Router** — Navegación
- **Axios** — HTTP client
- **vite-plugin-pwa** — Service Worker y manifest PWA
- **TypeScript** — Type safety

---

## 🔐 Autenticación

- JWT tokens almacenados en `localStorage`
- AuthContext proporciona estado global
- ProtectedRoute envuelve páginas que requieren login
- Tokens expiran automáticamente (verificación en cada request)

---

## 📝 Estructura

```
src/
├── pages/           — 8 páginas de la app
├── components/      — Componentes reutilizables
├── context/         — AuthContext (JWT state)
├── hooks/           — useCategorias, etc.
├── types/           — TypeScript interfaces
├── config/          — api.ts (cliente axios)
├── App.tsx          — Router principal
└── main.tsx         — Entry point
```

---

## 🚀 Deploy a EasyPanel

Ver [DEPLOY_EASYPANEL.md](../DEPLOY_EASYPANEL.md) en la raíz del proyecto para instrucciones completas.

---

## 📞 Soporte

Si necesitas revisar la arquitectura completa del sistema (base de datos, n8n workflows, Appsmith admin), ver la documentación en la carpeta raíz del proyecto.
