import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getAllFeedbacks(_req: Request, res: Response) {
  const result = await query(
    `SELECT f.id, f.content, f.recipient_id, f.source, f.submitted_at, f.is_moderated, f.rating, f.participant_id, f.feedback_type, f.criteria, e.name as recipient_name
     FROM feedbacks f
     LEFT JOIN employees e ON f.recipient_id = e.id
     ORDER BY f.submitted_at DESC`
  );
  return res.json({ feedbacks: result.rows });
}

export async function deleteFeedback(req: Request, res: Response) {
  const { id } = req.params;
  await query('DELETE FROM feedbacks WHERE id = $1', [id]);
  return res.json({ message: 'Feedback deleted' });
}

export async function getStats(_req: Request, res: Response) {
  const totalResult = await query('SELECT COUNT(*) as total FROM feedbacks');
  const moderatedResult = await query('SELECT COUNT(*) as moderated FROM feedbacks WHERE is_moderated = TRUE');
  const participantsResult = await query('SELECT COUNT(DISTINCT author_id) as participants FROM feedbacks WHERE author_id IS NOT NULL');

  return res.json({
    total: parseInt(totalResult.rows[0].total),
    moderated: parseInt(moderatedResult.rows[0].moderated),
    uniqueParticipants: parseInt(participantsResult.rows[0].participants)
  });
}

export async function moderateFeedback(req: Request, res: Response) {
  const { id } = req.params;
  const { isModerated } = req.body;
  await query('UPDATE feedbacks SET is_moderated = $1 WHERE id = $2', [isModerated, id]);
  return res.json({ message: 'Feedback moderated' });
}

export async function deleteEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const result = await query('DELETE FROM employees WHERE id = $1 AND role = $2', [id, 'user']);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  return res.json({ message: 'Employee deleted' });
}

export async function getEmployeeStats(_req: Request, res: Response) {
  const result = await query(`
    SELECT
      e.id,
      e.name,
      e.position,
      COUNT(f.id) as total_feedbacks,
      SUM(CASE WHEN f.rating >= 7 THEN 1 ELSE 0 END) as positive_feedbacks,
      SUM(CASE WHEN f.rating IN (5, 6) THEN 1 ELSE 0 END) as neutral_feedbacks,
      SUM(CASE WHEN f.rating <= 4 AND f.rating > 0 THEN 1 ELSE 0 END) as negative_feedbacks
    FROM employees e
    LEFT JOIN feedbacks f ON e.id = f.recipient_id
    GROUP BY e.id, e.name, e.position
    ORDER BY total_feedbacks DESC, e.name ASC
  `);
  
  // Convertir les chaînes en nombres (SUM renvoie des chaînes en PG)
  const stats = result.rows.map((row: any) => ({
    ...row,
    total_feedbacks: parseInt(row.total_feedbacks || '0'),
    positive_feedbacks: parseInt(row.positive_feedbacks || '0'),
    neutral_feedbacks: parseInt(row.neutral_feedbacks || '0'),
    negative_feedbacks: parseInt(row.negative_feedbacks || '0')
  }));
  
  return res.json({ employeeStats: stats });
}

export async function revealFeedbackAuthor(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;
  const superAdmin = res.locals.user;

  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return res.status(400).json({ message: 'Une raison est requise pour révéler un auteur.' });
  }

  const feedbackResult = await query('SELECT author_id FROM feedbacks WHERE id = $1', [id]);
  if (feedbackResult.rows.length === 0) {
    return res.status(404).json({ message: 'Feedback not found' });
  }

  const authorId = feedbackResult.rows[0].author_id;
  if (!authorId) {
    return res.status(404).json({ message: "Avis soumis avant l'activation de cette fonctionnalité, auteur introuvable." });
  }

  const authorResult = await query('SELECT name, email, position FROM employees WHERE id = $1', [authorId]);
  if (authorResult.rows.length === 0) {
    return res.status(404).json({ message: 'Auteur introuvable (compte supprimé).' });
  }

  await query(
    `INSERT INTO audit_logs(action, user_id, target_table, target_id, details)
     VALUES($1, $2, $3, $4, $5)`,
    ['reveal_feedback_author', superAdmin.userId, 'feedbacks', id, JSON.stringify({ reason: reason.trim(), revealedAuthorId: authorId })]
  );

  return res.json({ author: authorResult.rows[0] });
}
