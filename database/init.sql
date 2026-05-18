-- Initialisation de la base de données FeedbackApp
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  position VARCHAR(100) DEFAULT 'Employé',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  recipient_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  source VARCHAR(20) NOT NULL DEFAULT 'public',
  submitted_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_moderated BOOLEAN DEFAULT FALSE,
  rating INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  target_table VARCHAR(100) NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exemple de comptes
INSERT INTO employees (name, email, password_hash, role)
VALUES
  ('Admin SIM', 'admin@sim-assurances.ci', '$2b$12$4amWgyEVR8dxLQw9tCINEOOX8Bs5xUe1.2pN9oXgCKgjS3kWj0l0O', 'admin'),
  ('Test User', 'test@sim-assurances.ci', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeXt7hJc8t8hMzO4O', 'user')
ON CONFLICT (email) DO NOTHING;
