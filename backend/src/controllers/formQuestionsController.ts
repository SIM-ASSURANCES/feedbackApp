import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getFormQuestions(req: Request, res: Response) {
  const { formType } = req.query;
  const params: string[] = [];
  let sql = 'SELECT id, form_type, question_key, label, is_active, is_required, display_order FROM form_questions WHERE is_active = TRUE';
  if (formType) {
    params.push(String(formType));
    sql += ' AND form_type = $1';
  }
  sql += ' ORDER BY display_order ASC';
  const result = await query(sql, params);
  return res.json({ questions: result.rows });
}

export async function getAllFormQuestionsAdmin(_req: Request, res: Response) {
  const result = await query(
    'SELECT id, form_type, question_key, label, is_active, is_required, display_order FROM form_questions ORDER BY form_type ASC, display_order ASC'
  );
  return res.json({ questions: result.rows });
}

const QUESTION_KEY_PATTERN = /^[a-zA-Z0-9_]+$/;

export async function createFormQuestion(req: Request, res: Response) {
  const { formType, questionKey, label } = req.body;

  if (formType !== 'colleague') {
    return res.status(400).json({ message: "Seul le formulaire 'colleague' accepte de nouveaux critères pour le moment." });
  }
  if (typeof questionKey !== 'string' || !QUESTION_KEY_PATTERN.test(questionKey)) {
    return res.status(400).json({ message: 'Clé de question invalide (lettres, chiffres, underscore uniquement).' });
  }
  if (typeof label !== 'string' || label.trim().length === 0) {
    return res.status(400).json({ message: 'Le libellé est requis.' });
  }

  const existing = await query('SELECT id FROM form_questions WHERE form_type = $1 AND question_key = $2', [formType, questionKey]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ message: 'Cette clé de question existe déjà pour ce formulaire.' });
  }

  const orderResult = await query('SELECT COALESCE(MAX(display_order), 0) as max_order FROM form_questions WHERE form_type = $1', [formType]);
  const nextOrder = Number(orderResult.rows[0].max_order) + 1;

  const result = await query(
    `INSERT INTO form_questions(form_type, question_key, label, is_active, is_required, display_order)
     VALUES($1, $2, $3, TRUE, FALSE, $4)
     RETURNING id, form_type, question_key, label, is_active, is_required, display_order`,
    [formType, questionKey, label.trim(), nextOrder]
  );

  return res.status(201).json({ question: result.rows[0] });
}

export async function updateFormQuestion(req: Request, res: Response) {
  const { id } = req.params;
  const { label, isActive } = req.body;

  const existing = await query('SELECT is_required FROM form_questions WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ message: 'Question not found' });
  }

  const isRequired = existing.rows[0].is_required;
  const nextLabel = typeof label === 'string' && label.trim().length > 0 ? label.trim() : undefined;
  const nextIsActive = isRequired ? true : (typeof isActive === 'boolean' ? isActive : undefined);

  const result = await query(
    `UPDATE form_questions
     SET label = COALESCE($1, label), is_active = COALESCE($2, is_active)
     WHERE id = $3
     RETURNING id, form_type, question_key, label, is_active, is_required, display_order`,
    [nextLabel ?? null, nextIsActive ?? null, id]
  );

  return res.json({ question: result.rows[0] });
}
