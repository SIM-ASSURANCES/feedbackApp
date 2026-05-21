import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://feedback_user:simas2026@localhost:5432/feedback_app'
});

async function run() {
  try {
    const res = await pool.query('SELECT participant_id FROM feedbacks LIMIT 5');
    console.log('Sample participant_ids:', res.rows.map(r => r.participant_id));
    
    const count = await pool.query('SELECT COUNT(DISTINCT participant_id) FROM feedbacks');
    console.log('Distinct count:', count.rows[0].count);
  } catch (error) {
    console.error('DB Error:', error);
  } finally {
    await pool.end();
  }
}

run();
