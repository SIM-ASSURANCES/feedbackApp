const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function getById(id) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not defined');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query('SELECT id, name, email, position FROM employees WHERE id = $1', [id]);
    if (res.rowCount === 0) {
      console.log('Aucun employé trouvé pour id:', id);
    } else {
      console.log(res.rows[0]);
    }
  } catch (err) {
    console.error('Erreur:', err.message || err);
  } finally {
    await pool.end();
  }
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: node getEmployeeById.js <id>');
  process.exit(1);
}

getById(id);
