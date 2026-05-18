import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
}

function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.verify(token, secret) as JwtPayload;
}

export function authGuardUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (payload.role !== 'user') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.locals.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function authGuardAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (payload.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.locals.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
