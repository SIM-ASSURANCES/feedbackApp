import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://feedback_user:simas2026@localhost:5432/feedback_app'
});

async function run() {
  try {
    await pool.query('ALTER TABLE feedbacks ADD COLUMN participant_id VARCHAR(50);');
    console.log('Column participant_id added successfully.');
  } catch (error) {
    if (error.code === '42701') {
      console.log('Column participant_id already exists.');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await pool.end();
  }
}

run();
