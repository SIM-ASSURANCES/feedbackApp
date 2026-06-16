const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    await pool.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS position VARCHAR(100) DEFAULT 'Employé';");
    console.log('Colonne position ajoutée avec succès.');
  } catch (err) {
    console.error('Erreur :', err.message);
  } finally {
    await pool.end();
  }
})();
