-- ============================================================
-- Queries de referencia por página
-- Sistema de Control de Gastos Diarios
-- ============================================================
-- Parámetros nombrados:
--   :user_id        → ID del usuario autenticado
--   :is_admin       → TRUE si rol = 'admin'
--   :target_user_id → usuario a filtrar (NULL = todos, solo admin)
--   :mes            → 'YYYY-MM'
--   :fecha_desde    → DATE
--   :fecha_hasta    → DATE
--   :category_id    → INTEGER o NULL
--   :status         → VARCHAR o NULL
--   :search         → texto libre o NULL
--   :expense_id     → ID del gasto a editar
-- ============================================================

-- ============================================================
-- AUTH
-- ============================================================

-- Login: buscar usuario y verificar contraseña
SELECT id, name, email, phone, role, status, password_hash
FROM users
WHERE (email = :login OR phone = :login)
  AND status = 'active';
-- Verificación: SELECT verify_password(:password, password_hash)

-- Crear usuario (admin)
INSERT INTO users (name, email, phone, password_hash, role, status)
VALUES (
    :name,
    NULLIF(:email, ''),
    NULLIF(:phone, ''),
    hash_password(:password),
    :role,
    'active'
)
RETURNING id, name, email, phone, role, status, created_at;

-- ============================================================
-- DASHBOARD
-- ============================================================

-- KPI 1: Total del mes, cantidad y promedio
SELECT
    COALESCE(SUM(e.amount), 0)::FLOAT        AS total_mes,
    COUNT(e.id)::INTEGER                     AS cantidad,
    COALESCE(AVG(e.amount), 0)::FLOAT        AS promedio
FROM expenses e
WHERE TO_CHAR(e.expense_date, 'YYYY-MM') = :mes
  AND e.status = 'confirmed'
  AND (NOT :is_admin OR :target_user_id IS NULL OR e.user_id = :target_user_id)
  AND (:is_admin OR e.user_id = :user_id);

-- KPI 2: Total mes anterior (para comparativa)
SELECT COALESCE(SUM(amount), 0)::FLOAT AS total_mes_anterior
FROM expenses
WHERE TO_CHAR(expense_date, 'YYYY-MM') =
      TO_CHAR((TO_DATE(:mes, 'YYYY-MM') - INTERVAL '1 month'), 'YYYY-MM')
  AND status = 'confirmed'
  AND (:is_admin OR user_id = :user_id);

-- KPI 3: Mensajes pendientes/error (muestra a admin o al usuario propio)
SELECT
    COUNT(*) FILTER (WHERE processing_status = 'pending')::INTEGER AS pendientes,
    COUNT(*) FILTER (WHERE processing_status = 'error')::INTEGER   AS con_error
FROM messages
WHERE (:is_admin OR user_id = :user_id);

-- Gráfico: gasto diario últimos 30 días
SELECT
    expense_date::TEXT AS fecha,
    SUM(amount)::FLOAT AS total
FROM expenses
WHERE expense_date >= CURRENT_DATE - INTERVAL '30 days'
  AND status = 'confirmed'
  AND (:is_admin OR user_id = :user_id)
GROUP BY expense_date
ORDER BY expense_date ASC;

-- Gráfico: distribución por categoría del mes
SELECT
    c.name      AS categoria,
    c.icon      AS icono,
    c.color     AS color,
    SUM(e.amount)::FLOAT   AS total,
    COUNT(e.id)::INTEGER   AS cantidad,
    ROUND(SUM(e.amount) * 100.0 / NULLIF(SUM(SUM(e.amount)) OVER (), 0), 1)::FLOAT AS porcentaje
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
WHERE TO_CHAR(e.expense_date, 'YYYY-MM') = :mes
  AND e.status = 'confirmed'
  AND (:is_admin OR e.user_id = :user_id)
GROUP BY c.id, c.name, c.icon, c.color
ORDER BY total DESC;

-- Últimos 10 movimientos
SELECT
    e.id,
    e.amount,
    e.description,
    e.expense_date::TEXT,
    e.status,
    e.capture_channel,
    e.confidence_score,
    c.name  AS category_name,
    c.icon  AS category_icon,
    c.color AS category_color,
    u.name  AS user_name
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN users      u ON u.id = e.user_id
WHERE (:is_admin OR e.user_id = :user_id)
ORDER BY e.expense_date DESC, e.created_at DESC
LIMIT 10;

-- ============================================================
-- MOVIMIENTOS (tabla con filtros)
-- ============================================================

-- Lista paginada de gastos con todos los filtros
SELECT
    e.id,
    e.amount,
    e.description,
    e.expense_date::TEXT,
    e.status,
    e.capture_channel,
    e.payment_method,
    e.confidence_score,
    e.created_at,
    e.updated_at,
    c.id    AS category_id,
    c.name  AS category_name,
    c.icon  AS category_icon,
    c.color AS category_color,
    u.id    AS user_id,
    u.name  AS user_name,
    u.phone AS user_phone,
    e.message_id
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN users      u ON u.id = e.user_id
WHERE (:is_admin OR e.user_id = :user_id)
  AND (:target_user_id IS NULL OR e.user_id = :target_user_id)
  AND (:fecha_desde IS NULL OR e.expense_date >= :fecha_desde::DATE)
  AND (:fecha_hasta IS NULL OR e.expense_date <= :fecha_hasta::DATE)
  AND (:category_id IS NULL OR e.category_id = :category_id)
  AND (:status IS NULL OR e.status = :status)
  AND (:search IS NULL OR e.description ILIKE '%' || :search || '%')
ORDER BY e.expense_date DESC, e.created_at DESC
LIMIT :limit OFFSET :offset;

-- Conteo total (para paginación)
SELECT COUNT(*)::INTEGER AS total
FROM expenses e
WHERE (:is_admin OR e.user_id = :user_id)
  AND (:target_user_id IS NULL OR e.user_id = :target_user_id)
  AND (:fecha_desde IS NULL OR e.expense_date >= :fecha_desde::DATE)
  AND (:fecha_hasta IS NULL OR e.expense_date <= :fecha_hasta::DATE)
  AND (:category_id IS NULL OR e.category_id = :category_id)
  AND (:status IS NULL OR e.status = :status)
  AND (:search IS NULL OR e.description ILIKE '%' || :search || '%');

-- Detalle de un gasto (para modal de edición)
SELECT
    e.*,
    c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
    u.name AS user_name,
    m.raw_text AS message_raw_text, m.message_type
FROM expenses e
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN users      u ON u.id = e.user_id
LEFT JOIN messages   m ON m.id = e.message_id
WHERE e.id = :expense_id
  AND (:is_admin OR e.user_id = :user_id);

-- Actualizar gasto
UPDATE expenses SET
    amount         = COALESCE(:amount, amount),
    category_id    = COALESCE(:category_id, category_id),
    description    = COALESCE(:description, description),
    expense_date   = COALESCE(:expense_date::DATE, expense_date),
    payment_method = COALESCE(:payment_method, payment_method),
    status         = COALESCE(:status, status),
    updated_at     = NOW()
WHERE id = :expense_id
  AND (:is_admin OR (user_id = :user_id AND created_at > NOW() - INTERVAL '24 hours'))
RETURNING *;

-- Eliminar gasto (solo admin)
DELETE FROM expenses
WHERE id = :expense_id
  AND :is_admin = TRUE
RETURNING id;

-- ============================================================
-- NUEVO GASTO (inserción manual)
-- ============================================================

INSERT INTO expenses (
    user_id, category_id, amount, payment_method,
    description, expense_date, status,
    capture_channel, confidence_score
)
VALUES (
    :user_id,
    NULLIF(:category_id, 0),
    :amount,
    NULLIF(:payment_method, ''),
    NULLIF(:description, ''),
    COALESCE(:expense_date::DATE, CURRENT_DATE),
    'confirmed',
    :capture_channel,  -- 'manual' o 'appsmith'
    1.000
)
RETURNING *;

-- ============================================================
-- MENSAJES
-- ============================================================

-- Lista de mensajes con filtros
SELECT
    m.id,
    m.message_type,
    m.raw_text,
    m.raw_content,
    m.processing_status,
    m.error_reason,
    m.processed_at,
    m.created_at,
    u.id    AS user_id,
    u.name  AS user_name,
    u.phone AS user_phone,
    -- Gasto asociado
    e.id            AS expense_id,
    e.amount        AS expense_amount,
    e.status        AS expense_status,
    c.name          AS expense_category,
    c.icon          AS expense_category_icon
FROM messages m
LEFT JOIN users    u ON u.id = m.user_id
LEFT JOIN expenses e ON e.message_id = m.id
LEFT JOIN categories c ON c.id = e.category_id
WHERE (:is_admin OR m.user_id = :user_id)
  AND (:status IS NULL OR m.processing_status = :status)
ORDER BY m.created_at DESC
LIMIT :limit OFFSET :offset;

-- Marcar mensaje como reviewed (después de corrección manual)
UPDATE messages
SET processing_status = 'reviewed', processed_at = NOW()
WHERE id = :message_id
  AND :is_admin = TRUE
RETURNING *;

-- ============================================================
-- CATEGORÍAS
-- ============================================================

-- Listar todas
SELECT
    c.id,
    c.name,
    c.color,
    c.icon,
    c.is_active,
    c.created_at,
    COUNT(e.id)::INTEGER AS expense_count
FROM categories c
LEFT JOIN expenses e ON e.category_id = c.id
GROUP BY c.id, c.name, c.color, c.icon, c.is_active, c.created_at
ORDER BY c.name ASC;

-- Crear categoría
INSERT INTO categories (name, icon, color)
VALUES (:name, :icon, :color)
ON CONFLICT (name) DO NOTHING
RETURNING *;

-- Editar categoría
UPDATE categories SET
    name  = COALESCE(NULLIF(:name, ''), name),
    icon  = COALESCE(NULLIF(:icon, ''), icon),
    color = COALESCE(NULLIF(:color, ''), color)
WHERE id = :category_id
RETURNING *;

-- Toggle activo/inactivo
UPDATE categories
SET is_active = NOT is_active
WHERE id = :category_id
RETURNING *;

-- Eliminar categoría (solo si no tiene gastos)
DELETE FROM categories
WHERE id = :category_id
  AND (SELECT COUNT(*) FROM expenses WHERE category_id = :category_id) = 0
RETURNING id;

-- ============================================================
-- USUARIOS
-- ============================================================

-- Listar todos (admin)
SELECT
    u.id,
    u.name,
    u.email,
    u.phone,
    u.role,
    u.status,
    u.created_at,
    COUNT(e.id)::INTEGER AS expense_count,
    MAX(e.expense_date)::TEXT AS last_expense_date
FROM users u
LEFT JOIN expenses e ON e.user_id = u.id
GROUP BY u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at
ORDER BY u.created_at DESC;

-- Editar usuario (admin)
UPDATE users SET
    name   = COALESCE(NULLIF(:name, ''), name),
    email  = COALESCE(NULLIF(:email, ''), email),
    phone  = COALESCE(NULLIF(:phone, ''), phone),
    role   = COALESCE(NULLIF(:role, ''), role),
    status = COALESCE(NULLIF(:status, ''), status)
WHERE id = :target_user_id
RETURNING id, name, email, phone, role, status;

-- Cambiar contraseña (propio usuario)
UPDATE users
SET password_hash = hash_password(:new_password)
WHERE id = :user_id
  AND verify_password(:current_password, password_hash) = TRUE
RETURNING id;

-- Desactivar usuario (no eliminar)
UPDATE users SET status = 'inactive'
WHERE id = :target_user_id AND :is_admin = TRUE
RETURNING id, name, status;

-- ============================================================
-- REPORTES AVANZADOS (Appsmith)
-- ============================================================

-- Reporte mensual: total por mes (últimos 12 meses)
SELECT
    TO_CHAR(expense_date, 'YYYY-MM') AS mes,
    SUM(amount)::FLOAT               AS total,
    COUNT(*)::INTEGER                AS cantidad
FROM expenses
WHERE expense_date >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
  AND status = 'confirmed'
  AND (:is_admin OR user_id = :user_id)
GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
ORDER BY mes ASC;

-- Gastos por método de pago
SELECT
    COALESCE(payment_method, 'sin_especificar') AS metodo,
    SUM(amount)::FLOAT   AS total,
    COUNT(*)::INTEGER    AS cantidad
FROM expenses
WHERE TO_CHAR(expense_date, 'YYYY-MM') = :mes
  AND status = 'confirmed'
  AND (:is_admin OR user_id = :user_id)
GROUP BY payment_method
ORDER BY total DESC;

-- Tasa de error del procesamiento automático (admin)
SELECT
    COUNT(*)::INTEGER                                         AS total_mensajes,
    COUNT(*) FILTER (WHERE processing_status='processed')    AS procesados,
    COUNT(*) FILTER (WHERE processing_status='error')        AS con_error,
    COUNT(*) FILTER (WHERE processing_status='pending')      AS pendientes,
    ROUND(
        COUNT(*) FILTER (WHERE processing_status='error') * 100.0
        / NULLIF(COUNT(*), 0), 1
    )::FLOAT AS tasa_error_pct
FROM messages
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Gastos automáticos vs manuales
SELECT
    capture_channel,
    COUNT(*)::INTEGER    AS cantidad,
    SUM(amount)::FLOAT   AS total
FROM expenses
WHERE TO_CHAR(expense_date, 'YYYY-MM') = :mes
GROUP BY capture_channel;

-- Confianza promedio del procesamiento automático
SELECT
    ROUND(AVG(confidence_score)::NUMERIC, 3)::FLOAT  AS confianza_promedio,
    COUNT(*) FILTER (WHERE confidence_score >= 0.85)  AS alta_confianza,
    COUNT(*) FILTER (WHERE confidence_score < 0.85
                       AND confidence_score >= 0.50)  AS media_confianza,
    COUNT(*) FILTER (WHERE confidence_score < 0.50)   AS baja_confianza
FROM expenses
WHERE capture_channel = 'whatsapp'
  AND confidence_score IS NOT NULL;

-- ============================================================
-- AUDIT LOG (admin)
-- ============================================================

SELECT
    a.id,
    a.entity_type,
    a.entity_id,
    a.action,
    a.old_values,
    a.new_values,
    a.created_at,
    u.name AS actor_name
FROM audit_log a
LEFT JOIN users u ON u.id = a.user_id
WHERE (:entity_type IS NULL OR a.entity_type = :entity_type)
  AND (:entity_id IS NULL OR a.entity_id = :entity_id)
ORDER BY a.created_at DESC
LIMIT 100;
