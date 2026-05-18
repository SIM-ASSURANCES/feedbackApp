import { Request, Response } from 'express';
import { query } from '../utils/db';

export async function getEmployees(_req: Request, res: Response) {
  const result = await query('SELECT id, name, position FROM employees WHERE role = $1 ORDER BY name ASC', ['user']);
  return res.json({ employees: result.rows });
}
