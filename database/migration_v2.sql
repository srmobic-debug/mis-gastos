-- ============================================================
-- MIGRACIÓN: v1.0 → v2.0 (SIMPLIFICADA)
-- Sistema de Control de Gastos Diarios — Actualización
-- Seguro: No destruye datos, solo agrega lo faltante
-- ============================================================

-- ============================================================
-- PASO 0: Crear función set_updated_at() si no existe
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PASO 1: Agregar raw_content (JSONB) a messages si no existe
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'raw_content'
    ) THEN
        ALTER TABLE messages ADD COLUMN raw_content JSONB;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================
-- PASO 2: Agregar source_kind a expenses si no existe
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expenses' AND column_name = 'source_kind'
    ) THEN
        ALTER TABLE expenses
        ADD COLUMN source_kind VARCHAR(50)
        CHECK (source_kind IN ('text', 'audio', 'image', 'manual'));
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================
-- PASO 3: Actualizar processing_status enum en messages
-- ============================================================

DO $$
BEGIN
    -- Verifica si ya tiene el constraint correcto
    IF EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE table_name = 'messages' AND column_name = 'processing_status'
    ) THEN
        ALTER TABLE messages
        DROP CONSTRAINT IF EXISTS messages_processing_status_check;
    END IF;

    ALTER TABLE messages
    ADD CONSTRAINT messages_processing_status_check
    CHECK (processing_status IN (
        'pending',
        'received',
        'processed',
        'pending_clarification',
        'error',
        'reviewed'
    ));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================
-- PASO 4: NUEVA TABLA - pending_expenses
-- ============================================================

CREATE TABLE IF NOT EXISTS pending_expenses (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id      INTEGER REFERENCES messages(id) ON DELETE SET NULL,

    -- Datos en borrador
    draft_amount    NUMERIC(12, 2),
    draft_category  VARCHAR(50),
    draft_payment_method VARCHAR(50),
    draft_description TEXT,
    draft_expense_date DATE,

    -- Metadata del pendiente
    missing_fields  TEXT[] DEFAULT '{}',
    question_sent   BOOLEAN DEFAULT false,
    capture_channel VARCHAR(50),

    -- Estado
    status          VARCHAR(30) DEFAULT 'waiting_reply'
                    CHECK (status IN ('waiting_reply', 'resolved', 'expired', 'cancelled', 'merged')),

    -- Ciclo de clarificación
    clarification_count INTEGER DEFAULT 0,
    last_question_text TEXT,
    last_reply_text TEXT,

    -- Resolución
    resolved_expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Índices para pending_expenses
CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_user_status ON pending_expenses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_expenses(status);
CREATE INDEX IF NOT EXISTS idx_pending_created ON pending_expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_expenses(expires_at);

-- ============================================================
-- PASO 6: NUEVA TABLA - payment_methods (opcional)
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_methods (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    icon            VARCHAR(2),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales de payment_methods
INSERT INTO payment_methods (name, icon) VALUES
    ('Efectivo', '💵'),
    ('Transferencia', '🏦'),
    ('Mercado Pago', '🟢'),
    ('Tarjeta Crédito', '💳'),
    ('Tarjeta Débito', '💳'),
    ('Billetera Virtual', '📱'),
    ('Desconocido', '❓')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- PASO 7: NUEVA TABLA - event_log (Auditoría de eventos)
-- ============================================================

CREATE TABLE IF NOT EXISTS event_log (
    id              BIGSERIAL PRIMARY KEY,

    -- Identificación del evento
    event_type      VARCHAR(50) NOT NULL,

    -- Contexto
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message_id      INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    expense_id      INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
    pending_id      INTEGER REFERENCES pending_expenses(id) ON DELETE SET NULL,

    -- Datos del evento
    payload         JSONB NOT NULL,
    status          VARCHAR(20),

    -- Trazabilidad
    source          VARCHAR(50) DEFAULT 'n8n',
    step_number     INTEGER,

    -- Timestamp
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint de tipos válidos
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'message_received',
        'user_upserted',
        'message_saved',
        'message_classified',
        'image_analyzed',
        'audio_transcribed',
        'ai_extracted',
        'expense_validated',
        'expense_rejected',
        'clarification_required',
        'category_mapped',
        'category_not_found',
        'expense_created',
        'pending_created',
        'pending_updated',
        'pending_resolved',
        'reply_sent',
        'processing_error'
    ))
);

-- Índices para event_log
CREATE INDEX IF NOT EXISTS idx_event_log_user ON event_log(user_id);
CREATE INDEX IF NOT EXISTS idx_event_log_message ON event_log(message_id);
CREATE INDEX IF NOT EXISTS idx_event_log_expense ON event_log(expense_id);
CREATE INDEX IF NOT EXISTS idx_event_log_event_type ON event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_event_log_created ON event_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_user_created ON event_log(user_id, created_at DESC);

-- ============================================================
-- PASO 8: TRIGGERS - updated_at para nuevas tablas
-- ============================================================

DROP TRIGGER IF EXISTS trg_pending_expenses_updated_at ON pending_expenses;

CREATE TRIGGER trg_pending_expenses_updated_at
BEFORE UPDATE ON pending_expenses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- PASO 9: VISTAS - Actualizar para pending_expenses
-- ============================================================

-- Vista de pendientes con info de usuario
CREATE OR REPLACE VIEW v_pending_expenses AS
SELECT
    pe.id,
    pe.user_id,
    pe.message_id,
    pe.status,
    pe.missing_fields,
    pe.clarification_count,
    pe.created_at,
    pe.updated_at,
    pe.resolved_at,
    -- Usuario
    u.name AS user_name,
    u.phone AS user_phone,
    -- Datos en borrador
    pe.draft_amount,
    pe.draft_category,
    pe.draft_payment_method,
    pe.draft_description,
    -- Gasto final si se resolvió
    pe.resolved_expense_id,
    e.amount AS final_amount,
    e.status AS final_expense_status
FROM pending_expenses pe
LEFT JOIN users u ON u.id = pe.user_id
LEFT JOIN expenses e ON e.id = pe.resolved_expense_id;

-- ============================================================
-- PASO 10: FUNCIÓN - Registrar evento
-- ============================================================

CREATE OR REPLACE FUNCTION log_event(
    p_event_type VARCHAR,
    p_user_id INTEGER DEFAULT NULL,
    p_message_id INTEGER DEFAULT NULL,
    p_expense_id INTEGER DEFAULT NULL,
    p_pending_id INTEGER DEFAULT NULL,
    p_payload JSONB DEFAULT NULL,
    p_status VARCHAR DEFAULT 'success'
)
RETURNS BIGINT AS $$
DECLARE
    v_event_id BIGINT;
BEGIN
    INSERT INTO event_log (
        event_type,
        user_id,
        message_id,
        expense_id,
        pending_id,
        payload,
        status,
        created_at
    ) VALUES (
        p_event_type,
        p_user_id,
        p_message_id,
        p_expense_id,
        p_pending_id,
        p_payload,
        p_status,
        NOW()
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PASO 11: QUERIES ÚTILES - Ejemplos
-- ============================================================

-- Historial completo de un mensaje
-- SELECT * FROM event_log WHERE message_id = ? ORDER BY created_at;

-- Pendientes abiertos de un usuario
-- SELECT * FROM v_pending_expenses WHERE user_id = ? AND status = 'waiting_reply';

-- Gastos que necesitaron aclaración en últimos 30 días
-- SELECT COUNT(DISTINCT message_id) FROM event_log
-- WHERE event_type = 'clarification_required' AND created_at > NOW() - INTERVAL '30 days';

-- ============================================================
-- PASO 12: VERIFICACIÓN
-- ============================================================

-- Mostrar todas las tablas creadas
SELECT 'Migración completada. Tablas existentes:' AS status;

SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
