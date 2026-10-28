import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const payrollRouter = Router();

const createPeriodSchema = z.object({
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  notes: z.string().trim().max(5000).optional().nullable(),
}).refine((value) => value.periodEnd >= value.periodStart, {
  message: 'periodEnd must be on or after periodStart',
  path: ['periodEnd'],
});

payrollRouter.get('/periods', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT p.id, p.period_start AS "periodStart", p.period_end AS "periodEnd",
            p.status, p.notes, p.created_at AS "createdAt",
            COUNT(i.id)::int AS "employeeCount",
            COALESCE(SUM(i.net_salary), 0)::numeric(14, 2) AS "netPayroll"
     FROM payroll_periods p LEFT JOIN payroll_items i ON i.payroll_period_id = p.id
     GROUP BY p.id ORDER BY p.period_start DESC`,
  );
  response.json({ data: result.rows });
}));

payrollRouter.post('/periods', asyncHandler(async (request, response) => {
  const input = createPeriodSchema.parse(request.body);
  const result = await pool.query(
    `INSERT INTO payroll_periods (period_start, period_end, notes)
     VALUES ($1, $2, $3)
     RETURNING id, period_start AS "periodStart", period_end AS "periodEnd",
               status, notes, created_at AS "createdAt"`,
    [input.periodStart, input.periodEnd, input.notes ?? null],
  );
  response.status(201).json({ data: result.rows[0] });
}));

payrollRouter.get('/summary', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM employees WHERE employment_status = 'active') AS "activeEmployees",
       (SELECT COUNT(*)::int FROM departments) AS "departmentCount",
       (SELECT COUNT(*)::int FROM payroll_periods WHERE status = 'draft') AS "draftPayrollPeriods",
       (SELECT COALESCE(SUM(i.net_salary), 0)::numeric(14, 2)
          FROM payroll_items i JOIN payroll_periods p ON p.id = i.payroll_period_id
         WHERE p.status <> 'paid') AS "unpaidPayroll",
       (SELECT COUNT(*)::int FROM transactions WHERE status = 'needs_receipt') AS "missingReceipts"`,
  );
  response.json({ data: result.rows[0] });
}));