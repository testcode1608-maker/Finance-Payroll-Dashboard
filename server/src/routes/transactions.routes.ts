import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const transactionsRouter = Router();

transactionsRouter.get('/', asyncHandler(async (request, response) => {
  const status = request.query.status;
  const values: unknown[] = [];
  let statusFilter = '';
  if (typeof status === 'string' && ['pending', 'complete', 'needs_receipt'].includes(status)) {
    values.push(status);
    statusFilter = 'WHERE t.status = $1';
  }
  const result = await pool.query(
    `SELECT t.id, t.merchant, t.category, t.amount, t.transaction_date AS "transactionDate",
            t.department_id AS "departmentId", d.name AS "departmentName",
            t.employee_id AS "employeeId",
            CONCAT_WS(' ', e.first_name, e.last_name) AS "employeeName",
            t.description, t.status, t.created_at AS "createdAt"
     FROM transactions t
     LEFT JOIN departments d ON d.id = t.department_id
     LEFT JOIN employees e ON e.id = t.employee_id
     ${statusFilter}
     ORDER BY t.transaction_date DESC, t.id DESC LIMIT 200`,
    values,
  );
  response.json({ data: result.rows });
}));

const createTransactionSchema = z.object({
  merchant: z.string().trim().min(1).max(180),
  category: z.string().trim().min(1).max(100),
  amount: z.number().finite().min(0),
  transactionDate: z.string().date().optional(),
  departmentId: z.number().int().positive().optional().nullable(),
  employeeId: z.number().int().positive().optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(['pending', 'complete', 'needs_receipt']).default('needs_receipt'),
});

transactionsRouter.post('/', asyncHandler(async (request, response) => {
  const input = createTransactionSchema.parse(request.body);
  const result = await pool.query(
    `INSERT INTO transactions
       (merchant, category, amount, transaction_date, department_id, employee_id, description, status)
     VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, $7, $8)
     RETURNING id, merchant, category, amount, transaction_date AS "transactionDate",
       department_id AS "departmentId", employee_id AS "employeeId",
       description, status, created_at AS "createdAt"`,
    [input.merchant, input.category, input.amount, input.transactionDate ?? null,
      input.departmentId ?? null, input.employeeId ?? null, input.description ?? null, input.status],
  );
  response.status(201).json({ data: result.rows[0] });
}));
