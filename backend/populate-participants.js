import pkg from 'pg';
import { randomUUID } from 'crypto';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: 'postgresql://feedback_user:simas2026@localhost:5432/feedback_app'
});

async function run() {
  try {
    // Récupérer tous les feedbacks sans participant_id
    const res = await pool.query('SELECT id FROM feedbacks WHERE participant_id IS NULL');
    console.log(`Found ${res.rows.length} feedbacks without participant_id. Assigning one each...`);

    for (const row of res.rows) {
      const pid = randomUUID();
      await pool.query('UPDATE feedbacks SET participant_id = $1 WHERE id = $2', [pid, row.id]);
    }

    // Vérification finale
    const count = await pool.query('SELECT COUNT(DISTINCT participant_id) as total FROM feedbacks WHERE participant_id IS NOT NULL');
    console.log(`Done! Unique participants now: ${count.rows[0].total}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

run();
