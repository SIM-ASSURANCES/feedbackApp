import bcrypt from 'bcrypt';
import { query } from './db';

async function ensureSchema() {
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await query(`
    CREATE TABLE IF NOT EXISTS employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(10) NOT NULL DEFAULT 'user',
      position VARCHAR(100) DEFAULT 'Employé',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content TEXT NOT NULL,
      recipient_id UUID REFERENCES employees(id) ON DELETE CASCADE,
      source VARCHAR(20) NOT NULL DEFAULT 'public',
      submitted_at DATE NOT NULL DEFAULT CURRENT_DATE,
      is_moderated BOOLEAN DEFAULT FALSE,
      rating INTEGER DEFAULT 0,
      participant_id VARCHAR(50)
    )
  `);

  // Élargissement du rôle pour accueillir 'super_admin'
  await query(`ALTER TABLE employees ALTER COLUMN role TYPE VARCHAR(20)`);

  // Identité réelle de l'auteur (compte employé), détail par critère et type de formulaire
  await query(`ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES employees(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS criteria JSONB`);
  await query(`ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS feedback_type VARCHAR(20) NOT NULL DEFAULT 'colleague'`);

  // Un même auteur ne peut noter un même destinataire qu'une seule fois
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feedbacks_author_recipient
    ON feedbacks(author_id, recipient_id)
    WHERE author_id IS NOT NULL
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action VARCHAR(100) NOT NULL,
      user_id UUID REFERENCES employees(id) ON DELETE SET NULL,
      target_table VARCHAR(100) NOT NULL,
      target_id UUID,
      details JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS form_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      form_type VARCHAR(20) NOT NULL,
      question_key VARCHAR(50) NOT NULL,
      label TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_required BOOLEAN NOT NULL DEFAULT FALSE,
      display_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(form_type, question_key)
    )
  `);
}

const DEFAULT_FORM_QUESTIONS: Array<{ formType: string; questionKey: string; label: string; isRequired: boolean; order: number }> = [
  { formType: 'colleague', questionKey: 'workQuality', label: "💼 Comment évaluez-vous la qualité de votre travail avec ce collaborateur ?", isRequired: false, order: 1 },
  { formType: 'colleague', questionKey: 'communication', label: "🗣️ Cette personne communique-t-elle efficacement ?", isRequired: false, order: 2 },
  { formType: 'colleague', questionKey: 'teamwork', label: "🤝 Cette personne favorise-t-elle un bon esprit d'équipe ?", isRequired: false, order: 3 },
  { formType: 'colleague', questionKey: 'atmosphere', label: "✨ Cette personne contribue-t-elle à une bonne ambiance au travail ?", isRequired: false, order: 4 },
  { formType: 'colleague', questionKey: 'cooperation', label: "🙋 Cette personne est-elle disponible et coopérative ?", isRequired: false, order: 5 },
  { formType: 'colleague', questionKey: 'deadlines', label: "⏳ Cette personne respecte-t-elle les délais d'engagements ?", isRequired: false, order: 6 },
  { formType: 'colleague', questionKey: 'globalRating', label: "🎯 Globalement, comment évaluez-vous ce collaborateur ?", isRequired: true, order: 7 },
  { formType: 'conditions', questionKey: 'q1', label: "🛠️ Tu disposes des outils nécessaires pour bien travailler ?", isRequired: false, order: 1 },
  { formType: 'conditions', questionKey: 'q2', label: "⚖️ Ta charge de travail est raisonnable ?", isRequired: false, order: 2 },
  { formType: 'conditions', questionKey: 'q3', label: "🏢 Ton environnement de travail est satisfaisant ?", isRequired: false, order: 3 },
  { formType: 'conditions', questionKey: 'q4', label: "📢 Les objectifs et consignes sont clairement communiqués ?", isRequired: false, order: 4 },
  { formType: 'conditions', questionKey: 'q5', label: "👂 Tu te sens écouté(e) lorsque tu exprimes une préoccupation ?", isRequired: false, order: 5 },
  { formType: 'conditions', questionKey: 'q6', label: "🗣️ La communication interne est efficace ?", isRequired: false, order: 6 },
  { formType: 'conditions', questionKey: 'q7', label: "🚀 Tu te sens motivé(e) et reconnu(e) dans ton travail ?", isRequired: false, order: 7 },
  { formType: 'conditions', questionKey: 'q8', label: "🎭 L'ambiance au sein de l'équipe est ?", isRequired: false, order: 8 },
  { formType: 'conditions', questionKey: 'q9', label: "📈 Tu vois des perspectives d'évolution pour toi ici ?", isRequired: false, order: 9 },
  { formType: 'conditions', questionKey: 'q10', label: "💖 Globalement tu es satisfait(e) de travailler ici ?", isRequired: true, order: 10 },
  { formType: 'conditions', questionKey: 'q11', label: "💌 Tu recommanderais SIM Assurances comme lieu de travail ?", isRequired: false, order: 11 }
];

async function ensureFormQuestions() {
  for (const q of DEFAULT_FORM_QUESTIONS) {
    await query(
      `INSERT INTO form_questions(form_type, question_key, label, is_required, display_order)
       VALUES($1, $2, $3, $4, $5)
       ON CONFLICT (form_type, question_key) DO NOTHING`,
      [q.formType, q.questionKey, q.label, q.isRequired, q.order]
    );
  }
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  const existing = await query('SELECT id FROM employees WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));
  await query(
    'INSERT INTO employees(name, email, password_hash, role) VALUES($1, $2, $3, $4)',
    [process.env.ADMIN_NAME ?? 'Admin', email, passwordHash, 'admin']
  );
  console.log(`Compte admin initialisé: ${email}`);
}

async function ensureSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    return;
  }

  const existing = await query('SELECT id FROM employees WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));
  await query(
    'INSERT INTO employees(name, email, password_hash, role) VALUES($1, $2, $3, $4)',
    [process.env.SUPER_ADMIN_NAME ?? 'Super Admin', email, passwordHash, 'super_admin']
  );
  console.log(`Compte super_admin initialisé: ${email}`);
}

export async function bootstrap() {
  await ensureSchema();
  await ensureAdmin();
  await ensureSuperAdmin();
  await ensureFormQuestions();
}
