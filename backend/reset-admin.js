import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: 'postgresql://feedback_user:simas2026@localhost:5432/feedback_app'
});

async function run() {
  try {
    const email = 'admin@sim-assurances.ci';
    const password = 'test123';
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Vérifier si l'utilisateur existe
    const res = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
    if (res.rows.length === 0) {
      await pool.query(
        'INSERT INTO employees(name, email, password_hash, role) VALUES($1, $2, $3, $4)',
        ['Admin SIM', email, passwordHash, 'admin']
      );
      console.log('Admin account created with password test123');
    } else {
      await pool.query(
        'UPDATE employees SET password_hash = $1 WHERE email = $2',
        [passwordHash, email]
      );
      console.log('Admin password reset to test123');
    }
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

run();
