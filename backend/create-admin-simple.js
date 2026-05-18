const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const adminEmail = 'admin@sim-assurances.ci';
    const adminPassword = 'Admin@2026';
    const adminHash = await bcrypt.hash(adminPassword, 12);
    
    console.log('Insertion de l\'admin...');
    const result = await pool.query(
      `INSERT INTO employees(name, email, password_hash, role) 
       VALUES($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET password_hash = $3
       RETURNING id, email, role`,
      ['Admin SIM Assurances', adminEmail, adminHash, 'admin']
    );
    
    console.log('\n✅ ADMIN CRÉÉ AVEC SUCCÈS\n');
    console.log('Email : ' + adminEmail);
    console.log('Mot de passe : ' + adminPassword);
    console.log('Rôle : admin\n');
  } catch (err) {
    console.error('Erreur :', err.message);
    console.error('Stack:', err.stack);
  } finally {
    await pool.end();
  }
})();
