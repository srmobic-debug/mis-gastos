# Deploy PWA a EasyPanel — Guía Paso a Paso

## 📋 Requisitos previos

- ✅ VPS Hostinger con IP: `31.97.83.191`
- ✅ EasyPanel instalado y accesible
- ✅ n8n corriendo en `n8n.srmobic.com`
- ✅ Código PWA en GitHub: `https://github.com/srmobic-debug/control_gastos`

---

## 🚀 Opción 1: Deploy desde GitHub (Recomendado)

### Paso 1: Crear nuevo Proyecto en EasyPanel

1. Abre EasyPanel en tu navegador (`https://31.97.83.191:8181` o tu URL configurada)
2. **Projects** → **Create Project**
3. Rellena:
   - **Project Name**: `pwa-gastos` (o el que prefieras)
   - **Description**: `PWA para control de gastos — React + Vite`
   - Click **Create**

### Paso 2: Agregar servicio Docker con GitHub

1. En el nuevo proyecto, **Services** → **Create Service**
2. Selecciona **Docker Image**
3. Elige **Source: GitHub Repository**
4. Configura:
   - **Repository**: `srmobic-debug/control_gastos`
   - **Branch**: `main`
   - **Dockerfile Path**: `pwa/Dockerfile`
   - **Build Context**: `pwa/` (solo la carpeta PWA)
   - **Service Name**: `pwa`

### Paso 3: Variables de Entorno y Build Args

En la sección **Environment Variables** o **Build Arguments**:

```
VITE_N8N_URL=https://n8n.srmobic.com/webhook
```

**Nota**: El Dockerfile lo inyecta como `ARG`, por lo que Vite lo usará en build-time.

### Paso 4: Configurar Puerto y Dominio

1. **Ports**:
   - Container Port: `80`
   - Host Port: (dejar en auto, o especificar `8080` si lo prefieres)

2. **Domain**:
   - Agregar dominio: `pwa.srmobic.com`
   - (Si usas Let's Encrypt, EasyPanel lo configurará automáticamente)

3. **Recursos** (opcional):
   - Memory Limit: `256 MB` (suficiente para nginx)
   - CPU Limit: `0.5`

### Paso 5: Deploy

1. Click **Deploy** o **Create Service**
2. EasyPanel clonará el repo, construirá la imagen y iniciará el contenedor
3. Verifica logs en **Logs** → busca `ready in X ms` para confirmar que nginx está corriendo

---

## 🚀 Opción 2: Deploy desde Dockerfile local

Si prefieres controlar el build localmente:

### Paso 1: Build local de la imagen

```bash
cd pwa

# Build la imagen Docker
docker build \
  --build-arg VITE_N8N_URL=https://n8n.srmobic.com/webhook \
  -t pwa-gastos:latest .
```

### Paso 2: Subir imagen a Docker Hub (opcional pero recomendado)

```bash
# Login
docker login

# Tag la imagen
docker tag pwa-gastos:latest tu-usuario/pwa-gastos:latest

# Push
docker push tu-usuario/pwa-gastos:latest
```

### Paso 3: Crear servicio en EasyPanel con imagen personalizada

1. **Projects** → tu proyecto → **Services** → **Create Service**
2. Selecciona **Docker Image**
3. **Source: Docker Hub**
4. **Image Name**: `tu-usuario/pwa-gastos:latest`
5. Configura dominio y puertos como en Opción 1

---

## ✅ Verificación post-deploy

### Test 1: Acceso a la PWA

```bash
# Desde tu máquina
curl -s https://pwa.srmobic.com/ | head -20

# O simplemente abre en navegador:
# https://pwa.srmobic.com/
```

Deberías ver HTML con el contenido de la PWA.

### Test 2: Conectividad a n8n

1. Abre DevTools (F12) → **Console**
2. Intenta login:
   - Email: `admin@gastos.local`
   - Password: `admin123`

3. En **Network**, verifica:
   - La petición a `https://n8n.srmobic.com/webhook/auth/login` es `200 OK`
   - Recibes un token JWT en la respuesta

### Test 3: Instalación como PWA

1. En Chrome/Brave en Android:
   - Abre `https://pwa.srmobic.com`
   - Menú (⋮) → **Instalar app**
   - Verifica que aparezca con icono en home

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'vite-plugin-pwa'"

**Causa**: Las dependencias no se instalaron durante el build.

**Solución**:
```bash
# Verifica que package-lock.json esté en el repo
git status

# Si falta, regénéralo:
cd pwa
npm ci
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

Luego redeploy en EasyPanel.

### Error: "404 en rutas de la PWA"

**Causa**: nginx no redirige correctamente a index.html.

**Solución**: Verifica que `nginx.conf` esté en `pwa/nginx.conf` y contiene:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Luego redeploy.

### Error: "Failed to fetch from n8n"

**Causa**: La variable `VITE_N8N_URL` no se inyectó correctamente en build-time.

**Solución**:
1. En EasyPanel, verifica **Environment Variables** / **Build Args** tiene:
   ```
   VITE_N8N_URL=https://n8n.srmobic.com/webhook
   ```
2. Redeploy

Nota: Vite necesita `VITE_` como prefijo para exponerlas en el cliente.

### Error: "CORS bloqueado en peticiones a n8n"

**Causa**: n8n no está configurado para aceptar requests desde `pwa.srmobic.com`.

**Solución**:
1. En n8n, verifica que los webhooks **no requieran autenticación manual** (usan JWT)
2. O agrega CORS headers en n8n:
   ```
   Access-Control-Allow-Origin: https://pwa.srmobic.com
   ```

---

## 📝 Notas de Configuración

| Aspecto | Valor |
|--------|-------|
| **Dominio PWA** | `pwa.srmobic.com` |
| **n8n Base URL** | `https://n8n.srmobic.com/webhook` |
| **DB** | PostgreSQL via n8n webhooks (no acceso directo desde PWA) |
| **Auth** | JWT (localStorage) |
| **Service Worker** | Cacheado automáticamente por Vite PWA plugin |
| **Build Time** | ~2-3 min (compilación React + optimización) |
| **Image Size** | ~20 MB (nginx alpine + build optimizado) |

---

## 🔄 Updates futuros

Si necesitas actualizar la PWA:

```bash
# En tu máquina local
cd pwa
# ... haz cambios ...
git add .
git commit -m "Update: feature description"
git push origin main

# En EasyPanel: Redeploy (automático si está configurado, o manual)
# Projects → pwa-gastos → Services → pwa → Redeploy
```

---

## 📞 Soporte

Si algo no funciona:
1. Revisa **Logs** en EasyPanel (cada servicio tiene su sección de logs)
2. Abre DevTools en el navegador (F12 → Console)
3. Verifica conectividad a n8n: `curl https://n8n.srmobic.com/webhook/health` (si existe endpoint)
