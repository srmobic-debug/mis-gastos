# Appsmith — Guía Completa de Configuración Admin
## Sistema de Control de Gastos

---

## 1. Datasource PostgreSQL

**Editor → Datasources → + New Datasource → PostgreSQL**

| Campo | Valor |
|-------|-------|
| Name | `PostgreSQL Gastos` |
| Host | `postgres` (nombre servicio Docker en EasyPanel) |
| Port | `5432` |
| Database | nombre de tu BD |
| Username | tu usuario |
| Password | tu contraseña |
| SSL | Desactivado |

Haz clic en **Test** → **Save**.

> Appsmith se considera herramienta de administrador exclusivo. No implementar autenticación de usuarios en Appsmith — usar el login de Appsmith como control de acceso.

---

## 2. Estructura de la aplicación

```
App: Gastos Admin
├── 📊 Dashboard         → KPIs + gráficas globales
├── 📋 Movimientos       → Tabla completa CRUD
├── 💬 Mensajes          → Bandeja WhatsApp + corrección
├── 🏷 Categorías        → CRUD catálogo
├── 👥 Usuarios          → Gestión de usuarios
└── 📈 Reportes          → Análisis avanzado + exportar
```

---

## 3. Página: Dashboard

### Queries

**`q_kpis_mes`** — Run on page load: ✅
```sql
SELECT
    COALESCE(SUM(amount), 0)::FLOAT   AS total_mes,
    COUNT(*)::INTEGER                 AS cantidad,
    COALESCE(AVG(amount), 0)::FLOAT   AS promedio
FROM expenses
WHERE TO_CHAR(expense_date, 'YYYY-MM') = {{dp_mes.formattedDate || new Date().toISOString().slice(0,7)}}
  AND status = 'confirmed';
```

**`q_kpi_anterior`** — Run on page load: ✅
```sql
SELECT COALESCE(SUM(amount), 0)::FLOAT AS total_anterior
FROM expenses
WHERE TO_CHAR(expense_date, 'YYYY-MM') =
      TO_CHAR(DATE_TRUNC('month', NOW()) - INTERVAL '1 month', 'YYYY-MM')
  AND status = 'confirmed';
```

**`q_mensajes_alertas`** — Run on page load: ✅
```sql
SELECT
    COUNT(*) FILTER (WHERE processing_status='pending')::INTEGER AS pendientes,
    COUNT(*) FILTER (WHERE processing_status='error')::INTEGER   AS con_error
FROM messages
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**`q_por_categoria`** — Run on page load: ✅
```sql
SELECT
    COALESCE(c.name, 'Sin categoría') AS name,
    COALESCE(c.icon, '📦')            AS icon,
    COALESCE(c.color, '#6b7280')      AS color,
    SUM(e.amount)::FLOAT              AS total,
    COUNT(e.id)::INTEGER              AS cantidad,
    ROUND(SUM(e.amount)*100.0/NULLIF(SUM(SUM(e.amount)) OVER(),0),1)::FLOAT AS pct
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
WHERE TO_CHAR(e.expense_date, 'YYYY-MM') = {{dp_mes.formattedDate || new Date().toISOString().slice(0,7)}}
  AND e.status = 'confirmed'
GROUP BY c.id, c.name, c.icon, c.color
ORDER BY total DESC;
```

**`q_gasto_diario`** — Run on page load: ✅
```sql
SELECT expense_date::TEXT AS fecha, SUM(amount)::FLOAT AS total
FROM expenses
WHERE expense_date >= CURRENT_DATE - INTERVAL '30 days'
  AND status = 'confirmed'
GROUP BY expense_date ORDER BY expense_date;
```

**`q_ultimos_movimientos`** — Run on page load: ✅
```sql
SELECT e.id, e.amount, e.description, e.expense_date::TEXT,
       e.status, e.capture_channel,
       c.name AS category, c.icon,
       u.name AS user_name
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN users u ON u.id = e.user_id
ORDER BY e.expense_date DESC, e.created_at DESC LIMIT 15;
```

### Widgets

**Fila de KPIs (4 Text widgets):**
- Total mes: `{{q_kpis_mes.data[0]?.total_mes?.toLocaleString('es-HN', {style:'currency', currency:'HNL'})}}`
- Cantidad: `{{q_kpis_mes.data[0]?.cantidad}}`
- Promedio: `{{q_kpis_mes.data[0]?.promedio?.toFixed(2)}}`
- Alertas: `{{q_mensajes_alertas.data[0]?.pendientes + q_mensajes_alertas.data[0]?.con_error}} pendientes/error`

**Chart (Pie) — Categorías:**
- Dataset: `{{q_por_categoria.data.map(d => ({x: d.name + ' ' + d.icon, y: d.total}))}}`

**Chart (Bar) — Gasto diario:**
- Dataset: `{{q_gasto_diario.data.map(d => ({x: d.fecha.slice(5), y: d.total}))}}`

**Table — Últimos movimientos:**
- Data: `{{q_ultimos_movimientos.data}}`

---

## 4. Página: Movimientos

### Widgets de filtro
- `dp_desde` — DatePicker (Desde)
- `dp_hasta` — DatePicker (Hasta)
- `sel_categoria` — Select (categorías de `q_categorias.data`)
- `sel_status` — Select (Confirmado/Pendiente/Incompleto/Error)
- `sel_usuario` — Select (usuarios de `q_usuarios_lista.data`)
- `inp_search` — Input de texto

**`q_gastos_filtrados`** — Run on page load: ✅
```sql
SELECT e.id, e.amount, e.description, e.expense_date::TEXT,
       e.status, e.capture_channel, e.payment_method, e.confidence_score,
       c.name AS category_name, c.icon, c.color,
       u.id AS user_id, u.name AS user_name
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN users u ON u.id = e.user_id
WHERE
  ({{dp_desde.selectedDate}} IS NULL OR e.expense_date >= {{dp_desde.selectedDate}}::DATE)
  AND ({{dp_hasta.selectedDate}} IS NULL OR e.expense_date <= {{dp_hasta.selectedDate}}::DATE)
  AND ({{sel_categoria.selectedOptionValue || ''}} = '' OR e.category_id = {{sel_categoria.selectedOptionValue}}::INTEGER)
  AND ({{sel_status.selectedOptionValue || ''}} = '' OR e.status = '{{sel_status.selectedOptionValue}}')
  AND ({{sel_usuario.selectedOptionValue || ''}} = '' OR e.user_id = {{sel_usuario.selectedOptionValue}}::INTEGER)
  AND ({{inp_search.text || ''}} = '' OR e.description ILIKE '%{{inp_search.text}}%')
ORDER BY e.expense_date DESC, e.created_at DESC
LIMIT 100;
```

**`q_update_gasto`** — (NO run on page load)
```sql
UPDATE expenses SET
  amount         = {{inp_monto_edit.text}}::NUMERIC,
  category_id    = NULLIF('{{sel_cat_edit.selectedOptionValue}}','')::INTEGER,
  description    = '{{inp_desc_edit.text}}',
  expense_date   = '{{dp_fecha_edit.selectedDate}}'::DATE,
  payment_method = NULLIF('{{sel_pago_edit.selectedOptionValue}}',''),
  status         = '{{sel_status_edit.selectedOptionValue}}',
  updated_at     = NOW()
WHERE id = {{tbl_gastos.selectedRow.id}}
RETURNING *;
```
Configurar: On success → Run `q_gastos_filtrados`

**`q_delete_gasto`** — (NO run on page load, request confirmation: ✅)
```sql
DELETE FROM expenses WHERE id = {{tbl_gastos.selectedRow.id}} RETURNING id;
```
Configurar: On success → Run `q_gastos_filtrados`

**Table `tbl_gastos`:**
- Data: `{{q_gastos_filtrados.data}}`
- Columna "Monto": formato `L {{currentRow.amount?.toLocaleString()}}`
- Columna "Estado": Tag con color según valor
- Columna "Acciones": Custom column con botones Editar y Eliminar

### Modal edición
Widgets: `inp_monto_edit`, `sel_cat_edit`, `inp_desc_edit`, `dp_fecha_edit`, `sel_pago_edit`, `sel_status_edit`
Botón Guardar → ejecuta `q_update_gasto` → cierra modal

---

## 5. Página: Mensajes

**`q_mensajes`** — Run on page load: ✅
```sql
SELECT
    m.id, m.message_type, m.raw_text, m.processing_status,
    m.error_reason, m.created_at,
    u.name AS user_name, u.phone AS user_phone,
    e.id AS expense_id, e.amount AS expense_amount,
    e.status AS expense_status,
    c.name AS expense_category, c.icon AS expense_icon
FROM messages m
LEFT JOIN users u ON u.id = m.user_id
LEFT JOIN expenses e ON e.message_id = m.id
LEFT JOIN categories c ON c.id = e.category_id
WHERE ({{sel_msg_status.selectedOptionValue || ''}} = ''
       OR m.processing_status = '{{sel_msg_status.selectedOptionValue}}')
ORDER BY m.created_at DESC
LIMIT 200;
```

**`q_mark_reviewed`** — (NO run on page load)
```sql
UPDATE messages SET processing_status = 'reviewed', processed_at = NOW()
WHERE id = {{tbl_mensajes.selectedRow.id}}
RETURNING *;
```

**`q_crear_gasto_desde_mensaje`** — (NO run on page load)
```sql
INSERT INTO expenses (user_id, message_id, category_id, amount, description, expense_date, status, capture_channel, confidence_score)
SELECT
  m.user_id,
  {{tbl_mensajes.selectedRow.id}},
  NULLIF('{{sel_cat_manual.selectedOptionValue}}','')::INTEGER,
  {{inp_monto_manual.text}}::NUMERIC,
  NULLIF('{{inp_desc_manual.text}}',''),
  COALESCE('{{dp_fecha_manual.selectedDate}}'::DATE, CURRENT_DATE),
  'confirmed',
  'appsmith',
  1.0
FROM messages m WHERE m.id = {{tbl_mensajes.selectedRow.id}}
RETURNING *;
```
Configurar: On success → Run `q_mensajes`, marcar mensaje como reviewed

**Table `tbl_mensajes`:**
- Columna "Tipo": 💬/🎤/📷 según message_type
- Columna "Texto": `{{currentRow.raw_text?.slice(0, 80)}}...`
- Columna "Estado": Tag coloreado
- Columna "Gasto": monto + categoría si existe
- Columna "Acciones": Crear gasto manual / Marcar revisado

---

## 6. Página: Categorías

**`q_categorias`** — Run on page load: ✅
```sql
SELECT c.*, COUNT(e.id)::INTEGER AS expense_count
FROM categories c LEFT JOIN expenses e ON e.category_id = c.id
GROUP BY c.id ORDER BY c.name;
```

**`q_insert_categoria`** — (NO run on page load)
```sql
INSERT INTO categories (name, icon, color)
VALUES ('{{inp_cat_name.text}}', '{{inp_cat_icon.text}}', '{{inp_cat_color.text}}')
RETURNING *;
```

**`q_update_categoria`** — (NO run on page load)
```sql
UPDATE categories SET
  name  = '{{inp_cat_name_edit.text}}',
  icon  = '{{inp_cat_icon_edit.text}}',
  color = '{{inp_cat_color_edit.text}}'
WHERE id = {{tbl_categorias.selectedRow.id}} RETURNING *;
```

**`q_toggle_categoria`** — (NO run on page load)
```sql
UPDATE categories SET is_active = NOT is_active WHERE id = {{tbl_categorias.selectedRow.id}};
```

---

## 7. Página: Usuarios

**`q_usuarios`** — Run on page load: ✅
```sql
SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at,
       COUNT(e.id)::INTEGER AS expense_count,
       MAX(e.expense_date)::TEXT AS last_expense
FROM users u LEFT JOIN expenses e ON e.user_id = u.id
GROUP BY u.id ORDER BY u.created_at DESC;
```

**`q_insert_usuario`** — (NO run on page load)
```sql
INSERT INTO users (name, email, phone, password_hash, role, status)
VALUES (
  '{{inp_usr_name.text}}',
  NULLIF('{{inp_usr_email.text}}',''),
  NULLIF('{{inp_usr_phone.text}}',''),
  hash_password('{{inp_usr_pass.text}}'),
  '{{sel_usr_role.selectedOptionValue}}',
  'active'
) RETURNING id, name, email, role, status;
```

**`q_update_usuario`** — (NO run on page load)
```sql
UPDATE users SET
  name   = COALESCE(NULLIF('{{inp_usr_name_e.text}}',''), name),
  email  = COALESCE(NULLIF('{{inp_usr_email_e.text}}',''), email),
  phone  = COALESCE(NULLIF('{{inp_usr_phone_e.text}}',''), phone),
  role   = '{{sel_usr_role_e.selectedOptionValue}}',
  status = '{{sel_usr_status_e.selectedOptionValue}}'
WHERE id = {{tbl_usuarios.selectedRow.id}} RETURNING *;
```

---

## 8. Página: Reportes

**`q_reporte_mensual`** — Run on page load: ✅
```sql
SELECT TO_CHAR(expense_date,'YYYY-MM') AS mes,
       SUM(amount)::FLOAT AS total,
       COUNT(*)::INTEGER AS cantidad
FROM expenses
WHERE expense_date >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
  AND status = 'confirmed'
GROUP BY mes ORDER BY mes;
```

**`q_por_canal`**
```sql
SELECT capture_channel, SUM(amount)::FLOAT AS total, COUNT(*)::INTEGER AS cantidad
FROM expenses
WHERE TO_CHAR(expense_date,'YYYY-MM') = {{sel_mes_reporte.selectedOptionValue || new Date().toISOString().slice(0,7)}}
GROUP BY capture_channel;
```

**`q_tasa_error`**
```sql
SELECT
    COUNT(*)                                                     AS total,
    COUNT(*) FILTER (WHERE processing_status='processed')        AS procesados,
    COUNT(*) FILTER (WHERE processing_status='error')            AS errores,
    ROUND(COUNT(*) FILTER (WHERE processing_status='error')*100.0/NULLIF(COUNT(*),0),1)::FLOAT AS tasa_error
FROM messages WHERE created_at >= NOW() - INTERVAL '30 days';
```

### JSObject: exportCSV
```javascript
export default {
  run: async () => {
    const rows = q_gastos_filtrados.data;
    const cols = ['id','amount','description','expense_date','status','capture_channel','category_name','user_name'];
    const csv = [
      cols.join(','),
      ...rows.map(r => cols.map(c => JSON.stringify(r[c] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 9. Notas de implementación

- Configurar **Request confirmation before running** en: `q_delete_gasto`, `q_update_usuario` con status='inactive'
- Usar **On success → Run query** para refrescar tablas después de mutaciones
- El botón "Exportar CSV" llama `exportCSV.run()`
- Los **DatePicker** deben tener formato `YYYY-MM-DD` para que funcionen las queries
- Para los Select de categorías y usuarios, crear queries `q_categorias_lista` y `q_usuarios_lista` simplificados que corran on page load y alimenten los options
