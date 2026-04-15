# Sr. Mobic - Control de Gastos Personal

Aplicación web para registrar, categorizar y analizar gastos personales en tiempo real.

## 📱 Stack Tecnológico

### Frontend (PWA)
- **React 18** + TypeScript
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilos responsive
- **Recharts** - Gráficos interactivos
- **Lucide React** - Iconos

### Backend
- **Node.js** + Express
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcryptjs** - Seguridad de contraseñas

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- PostgreSQL 12+
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/srmobic.git
cd srmobic

# Frontend
cd pwa
npm install
npm run dev

# Backend (en otra terminal)
cd backend
npm install
npm run dev
```

### Variables de Entorno

**Backend** - `backend/.env`:
```
DB_HOST=tu_host
DB_PORT=5432
DB_NAME=srmobic
DB_USER=postgres
DB_PASSWORD=tu_password
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_secret_seguro
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
```

**Frontend** - `pwa/.env.local`:
```
VITE_BACKEND_URL=http://localhost:3001
```

## 📂 Estructura del Proyecto

```
srmobic/
├── pwa/                    # Frontend React
│   ├── src/
│   │   ├── pages/         # Componentes de páginas
│   │   ├── components/    # Componentes reutilizables
│   │   ├── styles/        # Estilos globales
│   │   ├── context/       # Contexto de autenticación
│   │   └── config/        # Configuración
│   └── package.json
├── backend/               # Backend Node.js
│   ├── src/
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── routes/        # Rutas API
│   │   ├── middleware/    # Middleware
│   │   └── config/        # Configuración
│   └── package.json
└── README.md
```

## 🔄 Flujo de Trabajo

1. **Crea una rama** para tu feature: `git checkout -b feature/nombre`
2. **Haz cambios** y commits: `git commit -m "feat: descripción"`
3. **Push** a GitHub: `git push origin feature/nombre`
4. **Crea Pull Request** en GitHub
5. **Merge** después de aprobación

## 📝 Commits Semánticos

```
feat:    Nueva funcionalidad
fix:     Corrección de bug
docs:    Cambios en documentación
style:   Formato de código
refactor: Refactorización sin cambios funcionales
test:    Añadir o actualizar tests
chore:   Cambios en configuración
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Privado - Proyecto personal

## 👤 Autor

Sr. Mobic - Control de Gastos

---

**Desarrollado con ❤️ usando React + Node.js**
