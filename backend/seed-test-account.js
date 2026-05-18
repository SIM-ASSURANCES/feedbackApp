const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seedTestAccount() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'feedback_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  });

  try {
    await client.connect();

    // Hash du mot de passe "test123"
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Insérer le compte test
    await client.query(`
      INSERT INTO employees (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Test User', 'test@sim-assurances.ci', hashedPassword, 'user']);

    console.log('✅ Compte test créé avec succès!');
    console.log('📧 Email: test@sim-assurances.ci');
    console.log('🔑 Mot de passe: test123');
    console.log('👤 Rôle: user');

  } catch (error) {
    console.error('❌ Erreur lors de la création du compte test:', error.message);
  } finally {
    await client.end();
  }
}

seedTestAccount();