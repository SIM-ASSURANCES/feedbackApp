const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function resetPassword() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not defined in environment');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    const hashed = await bcrypt.hash('test123', 12);
    const res = await pool.query('UPDATE employees SET password_hash = $1 WHERE email = $2 RETURNING id, email', [hashed, 'test@sim-assurances.ci']);
    if (res.rowCount === 0) {
      console.log('Aucun utilisateur trouvé avec cet email.');
    } else {
      console.log('Mot de passe réinitialisé pour :', res.rows[0].email);
    }
  } catch (err) {
    console.error('Erreur:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetPassword();
