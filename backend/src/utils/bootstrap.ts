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

export async function bootstrap() {
  await ensureSchema();
  await ensureAdmin();
}
