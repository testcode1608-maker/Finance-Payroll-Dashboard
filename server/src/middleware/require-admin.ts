import type { NextFunction, Request, Response } from 'express';
import { getAdminSession } from '../routes/auth.routes.js';
export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  const authorization = request.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token || !getAdminSession(token)) {
    response.status(401).json({ error: 'Session expirée ou accès non autorisé. Connectez-vous à nouveau.' }); return;
  }
  next();
}
