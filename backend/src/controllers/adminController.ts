import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getAllFeedbacks(_req: Request, res: Response) {
  const result = await query(
    'SELECT id, content, recipient_id, source, submitted_at, is_moderated, rating FROM feedbacks ORDER BY submitted_at DESC'
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
  return res.json({
    total: parseInt(totalResult.rows[0].total),
    moderated: parseInt(moderatedResult.rows[0].moderated)
  });
}

export async function moderateFeedback(req: Request, res: Response) {
  const { id } = req.params;
  const { isModerated } = req.body;
  await query('UPDATE feedbacks SET is_moderated = $1 WHERE id = $2', [isModerated, id]);
  return res.json({ message: 'Feedback moderated' });
}
