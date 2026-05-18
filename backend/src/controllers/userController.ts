import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getUserFeedbacks(_req: Request, res: Response) {
  const sessionUser = res.locals.user;
  if (!sessionUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const result = await query(
    'SELECT id, content, submitted_at, source, rating FROM feedbacks WHERE recipient_id = $1 AND is_moderated = FALSE ORDER BY submitted_at DESC',
    [sessionUser.userId]
  );
  return res.json({ feedbacks: result.rows });
}

export async function getMe(_req: Request, res: Response) {
  const sessionUser = res.locals.user;
  if (!sessionUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const result = await query('SELECT id, name, email, position FROM employees WHERE id = $1', [sessionUser.userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.json(result.rows[0]);
}
