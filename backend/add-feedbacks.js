const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT id, name FROM employees');
    const employees = res.rows;
    
    const getEmpId = (namePart) => employees.find(e => e.name.toLowerCase().includes(namePart.toLowerCase()))?.id;
    
    const entrepriseId = getEmpId('entreprise');
    const aliceId = getEmpId('alice');
    const jeanId = getEmpId('jean');
    const claireId = getEmpId('claire');

    const feedbacks = [
      {
        content: "Une entreprise vraiment au top, les valeurs sont respectées et on s'y sent très bien ! L'évolution est possible.",
        recipient_id: entrepriseId,
        rating: 5,
        source: 'public'
      },
      {
        content: "Alice est une excellente manager, toujours à l'écoute de son équipe. Parfois un peu stricte sur les horaires mais très juste.",
        recipient_id: aliceId,
        rating: 4,
        source: 'public'
      },
      {
        content: "Le problème informatique a été résolu en un temps record. Merci pour ton professionnalisme et ta rapidité.",
        recipient_id: jeanId,
        rating: 5,
        source: 'public'
      },
      {
        content: "Les processus de recrutement sont un peu lents, il serait bien d'avoir plus de transparence sur l'avancée des dossiers en interne.",
        recipient_id: claireId,
        rating: 2,
        source: 'public'
      },
      {
        content: "Des efforts sont faits sur le bien-être au travail, mais il manque encore des espaces de détente appropriés pour les pauses.",
        recipient_id: entrepriseId,
        rating: 3,
        source: 'public'
      }
    ];

    for (const f of feedbacks) {
      if (f.recipient_id) {
        await pool.query(
          'INSERT INTO feedbacks(content, recipient_id, source, rating, is_moderated, submitted_at) VALUES($1, $2, $3, $4, false, CURRENT_DATE)',
          [f.content, f.recipient_id, f.source, f.rating]
        );
      }
    }
    
    console.log('✅ Feedbacks de test ajoutés avec succès !');
  } catch (err) {
    console.error('Erreur :', err.message);
  } finally {
    await pool.end();
  }
})();
