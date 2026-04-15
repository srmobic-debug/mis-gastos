# 🔌 VERIFICACIÓN DE CONEXIONES - MIS GASTOS

**Fecha:** 2026-04-14  
**Estado:** En proceso

---

## 📊 ENDPOINTS N8N DISPONIBLES

### ✅ **IMPLEMENTADOS EN WORKFLOWS**

| # | Método | Endpoint | Workflow | Estado |
|---|--------|----------|----------|--------|
| 1 | POST | `/auth/login` | AUTH_login.json | ✅ Funciona (admin) |
| 2 | GET | `/categorias` | GET_categorias.json | ❓ No probado |
| 3 | GET | `/gastos` | GET_gastos.json | ❓ No probado |
| 4 | POST | `/gastos` | POST_gastos.json | ❓ No probado |
| 5 | PUT | `/gastos/:id` | PUT_gastos.json | ❓ No probado |
| 6 | DELETE | `/gastos/:id` | DELETE_gastos.json | ❓ No probado |
| 7 | GET | `/resumen` | GET_resumen.json | ❓ No probado |
| 8 | - | WHATSAPP_texto | WHATSAPP_texto.json | ❓ No probado |

---

## 🎯 **ENDPOINTS ESPERADOS POR FRONTEND**

Del README de la app:

```
POST   /auth/login              ✅
GET    /categories              ✅ (categorias)
GET    /expenses?mes=...        ✅ (gastos)
POST   /expenses                ✅ (gastos)
PUT    /expenses/:id            ✅ (gastos/:id)
DELETE /expenses/:id            ✅ (gastos/:id)
GET    /resume?mes=...          ✅ (resumen)
GET    /messages                ❌ FALTA
GET    /expenses/from-message   ❌ FALTA
GET    /users                   ❌ FALTA
```

---

## 🧪 **PLAN DE VERIFICACIÓN**

### **FASE 1: Autenticación** (EN PROGRESO)
- [x] POST /auth/login - Admin
- [ ] POST /auth/login - Ismael
- [ ] POST /auth/login - Facundo
- [ ] POST /auth/login - Josho

**Bloqueador:** Solo funciona admin. Ver por qué otros usuarios fallan.

---

### **FASE 2: APIs Principales** (POR HACER)

**2.1 - Categorías**
```bash
curl -X GET http://localhost:5175/auth/login \
  -H "Authorization: Bearer {token}"
```
- [ ] GET /categorias - Listar todas
- [ ] Verificar que devuelva: id, nombre, icono, color

**2.2 - Gastos**
- [ ] GET /gastos - Listar (sin filtros)
- [ ] GET /gastos?mes=2024-04 - Con filtro de mes
- [ ] POST /gastos - Crear nuevo
- [ ] PUT /gastos/1 - Actualizar
- [ ] DELETE /gastos/1 - Eliminar

**2.3 - Resumen**
- [ ] GET /resumen - Sin mes (actual)
- [ ] GET /resumen?mes=2024-04 - Con mes específico

---

### **FASE 3: Features Pendientes** (NO INICIADO)
- [ ] GET /messages - Listar mensajes WhatsApp
- [ ] POST /expenses/from-message - Crear gasto desde mensaje
- [ ] GET /users - Listar usuarios

---

## 🔐 **CREDENCIALES PARA PRUEBAS**

```
admin@srmobic.com / admin123      ✅ Funciona
ismael@test.com / 123456          ❌ No funciona
facundo@test.com / 123456         ❌ No funciona
joseg3402@gmail.com / 123456      ❌ No funciona
```

---

## 🚨 **PROBLEMAS IDENTIFICADOS**

### **1. Login solo funciona para admin**
- Otros usuarios devuelven "Credenciales inválidas"
- Hashes bcrypt actualizados pero sigue fallando
- Posibles causas:
  - [ ] El workflow rechaza a otros usuarios
  - [ ] Las contraseñas no se validaban correctamente
  - [ ] Hay una lógica en n8n que solo permite admin

### **2. Otros endpoints no probados**
- No se sabe si están activos en n8n
- No se sabe si están respondiendo correctamente
- No se sabe si tienen errores de credenciales/conexión

---

## 📋 **CHECKLIST DE PRÓXIMOS PASOS**

- [ ] **Resolver:** ¿Por qué solo funciona admin?
  - Revisar logs de n8n
  - Debuggear workflow AUTH_login
  - Verificar credenciales en BD

- [ ] **Probar:** GET /categorias
  - Hacer curl/Postman
  - Verificar que devuelve datos
  - Actualizar frontend si respuesta es diferente

- [ ] **Probar:** GET /gastos
  - Sin parámetros
  - Con mes
  - Con categoría
  - Con usuario

- [ ] **Probar:** POST /gastos
  - Crear un gasto nuevo
  - Verificar que se guarda en BD

- [ ] **Documentar:** URL base, headers, formatos

---

## 🎬 **PRÓXIMA ACCIÓN**

1. Resolver bug de login de otros usuarios
2. Una vez funcione auth para todos → probar otros endpoints
3. Documentar respuestas exactas de cada endpoint
4. Ajustar frontend si las respuestas son diferentes

---

**Estado:** Bloqueado en Fase 1  
**Bloqueador:** Login solo funciona para admin
