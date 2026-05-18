const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL non définie!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    console.log('Connexion à PostgreSQL...');
    const res = await pool.query('SELECT NOW()');
    console.log('Connexion réussie:', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
})();
