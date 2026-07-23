import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getPublicFeedbacks(_req: Request, res: Response) {
  const result = await query(
    `SELECT f.id, f.content, f.source, f.submitted_at, f.rating, e.name AS recipient_name
     FROM feedbacks f
     JOIN employees e ON f.recipient_id = e.id
     WHERE f.is_moderated = FALSE AND f.source = $1
     ORDER BY f.submitted_at DESC`,
    ['public']
  );
  return res.json({ feedbacks: result.rows });
}

function isValidCriteria(criteria: unknown): criteria is Record<string, { score: number; tags?: string[] }> {
  if (typeof criteria !== 'object' || criteria === null || Array.isArray(criteria)) {
    return false;
  }
  return Object.values(criteria).every((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }
    const entry = value as { score?: unknown; tags?: unknown };
    return (
      typeof entry.score === 'number' &&
      entry.score >= 1 &&
      entry.score <= 5 &&
      (entry.tags === undefined || (Array.isArray(entry.tags) && entry.tags.every((t) => typeof t === 'string')))
    );
  });
}

export async function submitFeedback(req: Request, res: Response) {
  const authorId = res.locals.user?.userId;
  if (!authorId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { recipientId, content, rating, feedbackType, criteria } = req.body;
  if (!recipientId || !content || content.length < 20 || content.length > 1500) {
    return res.status(400).json({ message: 'Recipient and content are required (20-1500 chars)' });
  }

  if (recipientId === authorId) {
    return res.status(400).json({ message: 'Vous ne pouvez pas laisser un avis sur vous-même.' });
  }

  const type = feedbackType === 'conditions' ? 'conditions' : 'colleague';
  if (criteria !== undefined && criteria !== null && !isValidCriteria(criteria)) {
    return res.status(400).json({ message: 'Format de critères invalide' });
  }

  // Un même auteur ne peut noter un même destinataire qu'une seule fois
  const existing = await query(
    'SELECT id FROM feedbacks WHERE author_id = $1 AND recipient_id = $2',
    [authorId, recipientId]
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Vous avez déjà donné votre avis pour ce destinataire.' });
  }

  try {
    await query(
      `INSERT INTO feedbacks(id, content, recipient_id, source, submitted_at, is_moderated, rating, author_id, feedback_type, criteria)
       VALUES(gen_random_uuid(), $1, $2, $3, CURRENT_DATE, FALSE, $4, $5, $6, $7)`,
      [content.trim(), recipientId, 'public', rating || 0, authorId, type, type === 'colleague' && criteria ? JSON.stringify(criteria) : null]
    );
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ message: 'Vous avez déjà donné votre avis pour ce destinataire.' });
    }
    throw error;
  }

  return res.status(201).json({ message: 'Feedback submitted anonymously' });
}
