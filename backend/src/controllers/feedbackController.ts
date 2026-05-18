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

export async function submitFeedback(req: Request, res: Response) {
  const { recipientId, content, rating } = req.body;
  if (!recipientId || !content || content.length < 20 || content.length > 500) {
    return res.status(400).json({ message: 'Recipient and content are required (20-500 chars)' });
  }

  // Validation anti-spam basique
  const spamWords = ['spam', 'test', 'fake', 'dummy'];
  const lowerContent = content.toLowerCase();
  if (spamWords.some(word => lowerContent.includes(word))) {
    return res.status(400).json({ message: 'Content contains inappropriate words' });
  }

  // Vérifier le délai minimum entre soumissions (5 minutes)
  const recentFeedback = await query(
    'SELECT submitted_at FROM feedbacks WHERE recipient_id = $1 ORDER BY submitted_at DESC LIMIT 1',
    [recipientId]
  );
  if (recentFeedback.rows.length > 0) {
    const lastSubmission = new Date(recentFeedback.rows[0].submitted_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSubmission.getTime()) / (1000 * 60);
    if (diffMinutes < 5) {
      return res.status(429).json({ message: 'Please wait 5 minutes between submissions' });
    }
  }

  await query(
    'INSERT INTO feedbacks(id, content, recipient_id, source, submitted_at, is_moderated, rating) VALUES(gen_random_uuid(), $1, $2, $3, CURRENT_DATE, FALSE, $4)',
    [content.trim(), recipientId, 'public', rating || 0]
  );

  return res.status(201).json({ message: 'Feedback submitted anonymously' });
}
