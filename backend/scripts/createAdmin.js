const fs = require('fs');
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
  const name = 'Admin SIM';
  const email = 'admin@sim-assurances.ci';
  const password = 'test123';
  const role = 'admin';

  try {
    const existing = await pool.query('SELECT id FROM employees WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));
    const result = await pool.query(
      'INSERT INTO employees(name, email, password_hash, role) VALUES($1, $2, $3, $4) RETURNING id',
      [name, email, passwordHash, role]
    );
    console.log('Admin created successfully:', { id: result.rows[0].id, name, email, password, role });
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
