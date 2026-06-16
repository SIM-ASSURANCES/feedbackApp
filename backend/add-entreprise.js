const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const passwordHash = await bcrypt.hash('password123', 12);
    // On ajoute l'entreprise comme un "employé" avec un statut spécial
    const emp = ['L\'Entreprise (Général)', 'entreprise@sim-assurances.ci', passwordHash, 'user', 'Direction Générale'];

    await pool.query(
      'INSERT INTO employees(name, email, password_hash, role, position) VALUES($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      emp
    );
    console.log(`Employé ${emp[0]} ajouté.`);
  } catch (err) {
    console.error('Erreur :', err.message);
  } finally {
    await pool.end();
  }
})();
