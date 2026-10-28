import { Router } from 'express';
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