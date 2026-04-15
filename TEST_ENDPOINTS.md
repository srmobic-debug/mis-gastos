# 🧪 SCRIPT DE PRUEBA DE ENDPOINTS

**Usa este script en la consola (F12) de tu navegador en http://localhost:5173**

---

## 🔑 **PRIMERO: Obtener Token**

Ejecuta en console:

```javascript
// Guardar la URL base
const BASE_URL = 'https://n8n.srmobic.com/webhook';

// Obtener token del admin (que sí funciona)
const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    login: 'admin@srmobic.com',
    password: 'admin123'
  })
});

const loginData = await loginResponse.json();
console.log('🔐 LOGIN RESPONSE:', loginData);

// Guardar token para usar en próximas requests
const token = loginData.token;
const user = loginData.user;

console.log('✅ Token:', token ? 'Obtenido' : 'Error');
console.log('✅ Usuario:', user?.email);
```

---

## 1️⃣ **TEST: GET /categorias**

```javascript
const catResponse = await fetch(`${BASE_URL}/categorias`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const catData = await catResponse.json();
console.log('📁 GET /categorias:', catData);
```

**Esperado:**
```json
[
  { "id": 1, "nombre": "Comida", "icono": "🍕", "color": "#FF6B6B", "activo": true },
  { "id": 2, "nombre": "Transporte", ... }
]
```

---

## 2️⃣ **TEST: GET /gastos**

```javascript
const gastosResponse = await fetch(`${BASE_URL}/gastos`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const gastosData = await gastosResponse.json();
console.log('💰 GET /gastos:', gastosData);
```

**Con filtros:**

```javascript
// Con mes específico
const gastosConMes = await fetch(`${BASE_URL}/gastos?mes=2024-04`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

console.log('💰 GET /gastos?mes=2024-04:', await gastosConMes.json());
```

---

## 3️⃣ **TEST: GET /resumen**

```javascript
const resumenResponse = await fetch(`${BASE_URL}/resumen`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});

const resumenData = await resumenResponse.json();
console.log('📊 GET /resumen:', resumenData);
```

**Esperado:**
```json
{
  "total_mes": 1500.50,
  "cantidad": 12,
  "promedio": 125.04,
  "por_categoria": [...]
}
```

---

## 4️⃣ **TEST: POST /gastos (Crear nuevo)**

```javascript
const nuevoGasto = await fetch(`${BASE_URL}/gastos`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    monto: 50.00,
    descripcion: 'Test desde consola',
    categoria_id: 1,
    fecha: '2026-04-14',
    fuente: 'pwa'
  })
});

const gastoCreado = await nuevoGasto.json();
console.log('✅ POST /gastos:', gastoCreado);
```

---

## 5️⃣ **TEST: PUT /gastos/:id (Actualizar)**

```javascript
// Primero obtener ID de un gasto
const gastosParaActualizar = await fetch(`${BASE_URL}/gastos`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const gastos = await gastosParaActualizar.json();
const gastoId = gastos[0]?.id; // Tomar el primer gasto

if (gastoId) {
  const actualizarGasto = await fetch(`${BASE_URL}/gastos/${gastoId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      monto: 75.00,
      descripcion: 'Actualizado desde test'
    })
  });

  console.log('✏️ PUT /gastos/:id:', await actualizarGasto.json());
}
```

---

## 6️⃣ **TEST: DELETE /gastos/:id (Eliminar)**

```javascript
// Usar el mismo ID de arriba
if (gastoId) {
  const eliminarGasto = await fetch(`${BASE_URL}/gastos/${gastoId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('🗑️ DELETE /gastos/:id:', await eliminarGasto.json());
}
```

---

## 📋 **CHECKLIST DE RESULTADOS**

Después de ejecutar cada test, anota:

| Endpoint | Status | Respuesta | Funciona |
|----------|--------|-----------|----------|
| POST /auth/login | 200 | `{user, token}` | ✅ |
| GET /categorias | ? | ? | ? |
| GET /gastos | ? | ? | ? |
| GET /resumen | ? | ? | ? |
| POST /gastos | ? | ? | ? |
| PUT /gastos/:id | ? | ? | ? |
| DELETE /gastos/:id | ? | ? | ? |

---

## 🎯 **PRÓXIMOS PASOS**

1. Ejecuta los tests uno por uno
2. Comparte qué sale en cada uno
3. Si hay errores, vamos a debuggear
4. Ajustamos el frontend según las respuestas reales

**¿Listo para probar?** 🚀
