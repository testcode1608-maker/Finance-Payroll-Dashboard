import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';

export type AdminSession = { username: string; expiresAt: number };
const sessions = new Map<string, AdminSession>();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};
export const getAdminSession = (token: string) => {
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) { sessions.delete(token); return undefined; }
  return session;
};
export const authRouter = Router();
authRouter.post('/login', (request: Request, response: Response) => {
  const username = typeof request.body?.username === 'string' ? request.body.username : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!safeEqual(username, env.ADMIN_USERNAME) || !safeEqual(password, env.ADMIN_PASSWORD)) {
    response.status(401).json({ error: 'Nom d’utilisateur ou mot de passe incorrect.' }); return;
  }
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(token, { username, expiresAt });
  response.json({ data: { token, username, expiresAt: new Date(expiresAt).toISOString() } });
});
authRouter.post('/logout', (request: Request, response: Response) => {
  const authorization = request.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (token) sessions.delete(token);
  response.status(204).end();
});
