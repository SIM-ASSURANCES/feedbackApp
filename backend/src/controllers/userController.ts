import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { query } from '../utils/db';
import { computeColleagueSynthesis } from '../utils/synthesis';

export async function getUserFeedbackSynthesis(_req: Request, res: Response) {
  const sessionUser = res.locals.user;
  if (!sessionUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const synthesis = await computeColleagueSynthesis(sessionUser.userId);
  return res.json(synthesis);
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

export async function changePassword(req: Request, res: Response) {
  const sessionUser = res.locals.user;
  if (!sessionUser) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ message: 'Mot de passe actuel requis et nouveau mot de passe de 6 caractères minimum.' });
  }

  const result = await query('SELECT password_hash FROM employees WHERE id = $1', [sessionUser.userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });
  }

  const newHash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS ?? 12));
  await query('UPDATE employees SET password_hash = $1 WHERE id = $2', [newHash, sessionUser.userId]);

  return res.json({ message: 'Mot de passe mis à jour.' });
}
