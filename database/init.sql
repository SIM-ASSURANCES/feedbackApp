-- Initialisation de la base de données FeedbackApp
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
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
  rating INTEGER DEFAULT 0,
  participant_id VARCHAR(50),
  author_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  criteria JSONB,
  feedback_type VARCHAR(20) NOT NULL DEFAULT 'colleague'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_author_recipient
  ON feedbacks(author_id, recipient_id)
  WHERE author_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type VARCHAR(20) NOT NULL,
  question_key VARCHAR(50) NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(form_type, question_key)
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

-- Compte admin
INSERT INTO employees (name, email, password_hash, role)
VALUES
  ('Admin Feedback', 'admin@feedback.mysimassurances.com', '$2b$12$BjlYBYhYgdzD3W356atzuerxp1dRYJNQOUZQ2fdAOn47n75L8uTBC', 'admin')
ON CONFLICT (email) DO NOTHING;
