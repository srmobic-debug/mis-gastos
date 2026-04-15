-- ============================================================
-- Sistema de Control de Gastos Diarios — Schema completo
-- Versión: 2.0
-- Ejecutar en pgAdmin contra la base de datos de destino
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- para gen_salt y crypt

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    phone         VARCHAR(30)  UNIQUE,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(200) UNIQUE,
    password_hash VARCHAR(255),                      -- NULL si solo usa WhatsApp
    role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                  CHECK (role IN ('admin', 'user')),
    status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'unregistered')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    color      VARCHAR(7)   NOT NULL DEFAULT '#6366f1',
    icon       VARCHAR(10)  NOT NULL DEFAULT '💰',
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    channel_message_id VARCHAR(100) UNIQUE,               -- ID único de WhatsApp
    message_type       VARCHAR(20)  NOT NULL DEFAULT 'text'
                       CHECK (message_type IN ('text', 'audio', 'image', 'document')),
    raw_text           TEXT,                              -- texto original o transcripción
    raw_content        TEXT,                              -- URL del archivo si es audio/imagen
    processing_status  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                       CHECK (processing_status IN ('pending', 'processed', 'error', 'reviewed')),
    error_reason       TEXT,
    processed_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: expenses
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message_id       INTEGER        REFERENCES messages(id) ON DELETE SET NULL,
    category_id      INTEGER        REFERENCES categories(id) ON DELETE SET NULL,
    amount           NUMERIC(12,2)  NOT NULL CHECK (amount > 0),
    payment_method   VARCHAR(30)    CHECK (payment_method IN ('cash','card','transfer','other')),
    description      TEXT,
    expense_date     DATE           NOT NULL DEFAULT CURRENT_DATE,
    status           VARCHAR(20)    NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed','pending','incomplete','error')),
    capture_channel  VARCHAR(20)    NOT NULL DEFAULT 'manual'
                     CHECK (capture_channel IN ('whatsapp','manual','appsmith')),
    confidence_score NUMERIC(4,3)   CHECK (confidence_score BETWEEN 0 AND 1),
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER     REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id   INTEGER     NOT NULL,
    action      VARCHAR(50) NOT NULL,
    old_values  JSONB,
    new_values  JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_expenses_user_date    ON expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status       ON expenses (status);
CREATE INDEX IF NOT EXISTS idx_expenses_category     ON expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_message      ON expenses (message_id);
CREATE INDEX IF NOT EXISTS idx_messages_user         ON messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status       ON messages (processing_status);
CREATE INDEX IF NOT EXISTS idx_audit_entity          ON audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created         ON audit_log (created_at DESC);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- VISTAS útiles
-- ============================================================

-- Vista completa de gastos (join con categoría y usuario)
CREATE OR REPLACE VIEW v_expenses AS
SELECT
    e.id,
    e.amount,
    e.description,
    e.expense_date,
    e.status,
    e.capture_channel,
    e.confidence_score,
    e.payment_method,
    e.created_at,
    e.updated_at,
    -- Usuario
    u.id          AS user_id,
    u.name        AS user_name,
    u.phone       AS user_phone,
    -- Categoría
    c.id          AS category_id,
    c.name        AS category_name,
    c.icon        AS category_icon,
    c.color       AS category_color,
    -- Mensaje origen
    e.message_id,
    m.message_type,
    m.raw_text    AS message_raw_text
FROM expenses e
JOIN users      u ON u.id = e.user_id
LEFT JOIN categories c ON c.id = e.category_id
LEFT JOIN messages   m ON m.id = e.message_id;

-- Vista de mensajes con info del gasto generado
CREATE OR REPLACE VIEW v_messages AS
SELECT
    msg.id,
    msg.message_type,
    msg.raw_text,
    msg.raw_content,
    msg.processing_status,
    msg.error_reason,
    msg.processed_at,
    msg.created_at,
    u.id    AS user_id,
    u.name  AS user_name,
    u.phone AS user_phone,
    -- Gasto asociado (puede ser NULL)
    exp.id            AS expense_id,
    exp.amount        AS expense_amount,
    exp.status        AS expense_status,
    cat.name          AS expense_category,
    cat.icon          AS expense_category_icon
FROM messages msg
LEFT JOIN users    u   ON u.id   = msg.user_id
LEFT JOIN expenses exp ON exp.message_id = msg.id
LEFT JOIN categories cat ON cat.id = exp.category_id;

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Categorías base
INSERT INTO categories (name, icon, color) VALUES
    ('Alimentación',    '🍔', '#f97316'),
    ('Transporte',      '🚗', '#3b82f6'),
    ('Servicios',       '💡', '#eab308'),
    ('Salud',           '💊', '#ef4444'),
    ('Entretenimiento', '🎬', '#8b5cf6'),
    ('Ropa',            '👕', '#ec4899'),
    ('Hogar',           '🏠', '#14b8a6'),
    ('Educación',       '📚', '#0ea5e9'),
    ('Otros',           '📦', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Usuario administrador por defecto
-- IMPORTANTE: cambiar la contraseña después del primer login
INSERT INTO users (name, email, password_hash, role, status) VALUES
    ('Administrador',
     'admin@srmobic.com',
     crypt('Admin1234!', gen_salt('bf', 12)),
     'admin',
     'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- FUNCIÓN auxiliar: hash de contraseña
-- Uso: SELECT hash_password('MiContraseña');
-- ============================================================
CREATE OR REPLACE FUNCTION hash_password(plain TEXT)
RETURNS TEXT AS $$
    SELECT crypt(plain, gen_salt('bf', 12));
$$ LANGUAGE sql;

-- ============================================================
-- FUNCIÓN auxiliar: verificar contraseña
-- Uso: SELECT verify_password('ingresada', password_hash FROM users WHERE email='...');
-- ============================================================
CREATE OR REPLACE FUNCTION verify_password(plain TEXT, hashed TEXT)
RETURNS BOOLEAN AS $$
    SELECT crypt(plain, hashed) = hashed;
$$ LANGUAGE sql;
