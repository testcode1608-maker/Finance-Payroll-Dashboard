import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { departmentsRouter } from './routes/departments.routes.js';
import { cardsRouter } from './routes/cards.routes.js';
import { budgetsRouter } from './routes/budgets.routes.js';
import { duesRouter } from './routes/dues.routes.js';
import { employeesRouter } from './routes/employees.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { payrollRouter } from './routes/payroll.routes.js';
import { transactionsRouter } from './routes/transactions.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { requireAdmin } from './middleware/require-admin.js';

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_request, response) => {
  response.json({ service: 'finance-payroll-api', status: 'ok', health: '/api/health' });
});
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', requireAdmin);
app.use('/api/departments', departmentsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/dues', duesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/transactions', transactionsRouter);
app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);