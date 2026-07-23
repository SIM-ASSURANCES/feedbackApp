-- ============================================================
-- Migration Supabase - FeedbackApp SIM Assurances
-- ============================================================
-- pgcrypto est déjà activée par défaut sur Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLE: employees
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role         VARCHAR(20)  NOT NULL DEFAULT 'user'
                            CHECK (role IN ('user', 'admin', 'super_admin')),
  position     VARCHAR(100) DEFAULT 'Employé',
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: feedbacks
-- ============================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  content      TEXT         NOT NULL,
  recipient_id UUID         REFERENCES employees(id) ON DELETE CASCADE,
  source       VARCHAR(20)  NOT NULL DEFAULT 'public'
                            CHECK (source IN ('public', 'internal')),
  submitted_at DATE         NOT NULL DEFAULT CURRENT_DATE,
  is_moderated BOOLEAN      DEFAULT FALSE,
  rating       INTEGER      DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  participant_id VARCHAR(50),
  author_id    UUID         REFERENCES employees(id) ON DELETE SET NULL,
  criteria     JSONB,
  feedback_type VARCHAR(20) NOT NULL DEFAULT 'colleague'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_author_recipient
  ON feedbacks(author_id, recipient_id)
  WHERE author_id IS NOT NULL;

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  action       VARCHAR(100) NOT NULL,
  user_id      UUID         REFERENCES employees(id) ON DELETE SET NULL,
  target_table VARCHAR(100) NOT NULL,
  target_id    UUID,
  details      JSONB,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEX pour améliorer les performances
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_feedbacks_recipient ON feedbacks(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_submitted ON feedbacks(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- COMPTE ADMIN PAR DÉFAUT
-- mot de passe : Admin@2026 (bcrypt $2b$12$...)
-- ============================================================
INSERT INTO employees (name, email, password_hash, role, position)
VALUES (
  'Admin SIM',
  'admin@sim-assurances.ci',
  '$2b$12$4amWgyEVR8dxLQw9tCINEOOX8Bs5xUe1.2pN9oXgCKgjS3kWj0l0O',
  'admin',
  'Administrateur'
)
ON CONFLICT (email) DO NOTHING;
