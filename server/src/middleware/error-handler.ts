import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Validation failed',
      details: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const databaseCode = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';

  if (databaseCode === '23505') {
    response.status(409).json({ error: 'A record with these unique values already exists.' });
    return;
  }

  if (databaseCode === '23503') {
    response.status(400).json({ error: 'The requested related record does not exist.' });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Internal server error' });
};