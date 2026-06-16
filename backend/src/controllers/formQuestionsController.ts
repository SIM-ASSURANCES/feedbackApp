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
