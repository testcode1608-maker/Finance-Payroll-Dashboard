import { Router } from 'express';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const healthRouter = Router();

healthRouter.get('/', asyncHandler(async (_request, response) => {
  const result = await pool.query<{ database: string; database_user: string }>(
    'SELECT current_database() AS database, current_user AS database_user',
  );

  response.json({
    status: 'ok',
    service: 'finance-payroll-api',
    database: result.rows[0].database,
    databaseUser: result.rows[0].database_user,
    timestamp: new Date().toISOString(),
  });
}));