import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { query } from '../utils/db';
import fs from 'fs';
import path from 'path';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  let user = null;

  try {
    // Essayer d'abord la base de données
    const result = await query('SELECT id, password_hash, role FROM employees WHERE email = $1', [email]);
    user = result.rows[0];
  } catch (dbError) {
    // Fallback vers les comptes de test si la DB n'est pas disponible
    console.log('Base de données non disponible, utilisation des comptes de test');
    try {
      const testAccountsPath = path.join(__dirname, '../../test-accounts.json');
      const testAccounts = JSON.parse(fs.readFileSync(testAccountsPath, 'utf8'));
      user = testAccounts.find((account: any) => account.email === email);
    } catch (fileError) {
      console.error('Erreur lors du chargement des comptes de test:', fileError);
    }
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    secret as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '24h' } as jwt.SignOptions
  );

  return res.json({ token, role: user.role });
}

export async function registerController(req: Request, res: Response) {
  try {
    const { name, email, password, position } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await query('SELECT id FROM employees WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));
    const result = await query(
      'INSERT INTO employees(name, email, password_hash, role, position) VALUES($1, $2, $3, $4, $5) RETURNING id',
      [name.trim(), email.trim().toLowerCase(), passwordHash, 'user', position?.trim() || 'Employé']
    );

    return res.status(201).json({ message: 'Compte créé', userId: result.rows[0].id });
  } catch (error) {
    console.error('Erreur dans registerController :', error);
    return res.status(500).json({ message: 'Impossible de créer le compte. Vérifiez les informations.' });
  }
}
