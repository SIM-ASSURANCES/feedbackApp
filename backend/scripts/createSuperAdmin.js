const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not defined in backend/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  const name = process.argv[2] || 'Super Admin';
  const email = process.argv[3];
  const password = process.argv[4];

  if (!email || !password) {
    console.error('Usage: node scripts/createSuperAdmin.js "Nom complet" email@sim-assurances.ci motdepasse');
    process.exit(1);
  }

  try {
    await pool.query(`ALTER TABLE employees ALTER COLUMN role TYPE VARCHAR(20)`);

    const existing = await pool.query('SELECT id FROM employees WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Un compte existe déjà avec cet email:', email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));
    const result = await pool.query(
      'INSERT INTO employees(name, email, password_hash, role) VALUES($1, $2, $3, $4) RETURNING id',
      [name, email, passwordHash, 'super_admin']
    );
    console.log('Compte super_admin créé avec succès:', { id: result.rows[0].id, name, email, role: 'super_admin' });
  } catch (err) {
    console.error('Erreur lors de la création du super_admin:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
