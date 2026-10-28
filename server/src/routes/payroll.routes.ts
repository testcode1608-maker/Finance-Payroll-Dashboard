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

const itemSchema = z.object({
  employeeId: z.number().int().positive(),
  bonuses: z.number().finite().min(0).default(0),
  deductions: z.number().finite().min(0).default(0),
});
const periodIdSchema = z.coerce.number().int().positive();

payrollRouter.get('/periods/:id/items', asyncHandler(async (request, response) => {
  const periodId = periodIdSchema.parse(request.params.id);
  const result = await pool.query(
    `SELECT i.id, i.payroll_period_id AS "payrollPeriodId", i.employee_id AS "employeeId",
       e.employee_code AS "employeeCode", CONCAT_WS(' ',e.first_name,e.last_name) AS "employeeName",
       e.position, i.base_salary AS "baseSalary", i.bonuses, i.deductions, i.net_salary AS "netSalary",
       i.payment_status AS "paymentStatus", i.paid_at AS "paidAt"
     FROM payroll_items i JOIN employees e ON e.id=i.employee_id
     WHERE i.payroll_period_id=$1 ORDER BY e.last_name,e.first_name`,
    [periodId],
  );
  response.json({ data: result.rows });
}));

payrollRouter.post('/periods/:id/generate', asyncHandler(async (request, response) => {
  const periodId = periodIdSchema.parse(request.params.id);
  const overridesSchema = z.object({
    items: z.array(itemSchema).optional(),
    includeInactive: z.boolean().default(false),
  });
  const options = overridesSchema.parse(request.body ?? {});
  const period = await pool.query('SELECT id,status FROM payroll_periods WHERE id=$1', [periodId]);
  if (!period.rowCount) { response.status(404).json({ error: 'Payroll period not found' }); return; }
  if (period.rows[0].status !== 'draft') {
    response.status(409).json({ error: 'Only draft payroll periods can be generated or changed.' }); return;
  }
  const employees = await pool.query(
    `SELECT id,base_salary FROM employees
     WHERE ($1::boolean OR employment_status='active')
     ORDER BY id`, [options.includeInactive],
  );
  const overrides = new Map((options.items ?? []).map(item => [item.employeeId, item]));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const employee of employees.rows) {
      const override = overrides.get(Number(employee.id));
      const baseSalary = Number(employee.base_salary);
      const bonuses = override?.bonuses ?? 0;
      const deductions = override?.deductions ?? 0;
      if (deductions > baseSalary + bonuses) {
        throw new Error(`Deductions exceed gross salary for employee ${employee.id}`);
      }
      await client.query(
        `INSERT INTO payroll_items(payroll_period_id,employee_id,base_salary,bonuses,deductions)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT(payroll_period_id,employee_id) DO UPDATE
         SET base_salary=EXCLUDED.base_salary,bonuses=EXCLUDED.bonuses,deductions=EXCLUDED.deductions`,
        [periodId, employee.id, baseSalary, bonuses, deductions],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && error.message.startsWith('Deductions exceed')) {
      response.status(400).json({ error: error.message }); return;
    }
    throw error;
  } finally { client.release(); }
  const result = await pool.query(
    `SELECT i.id,i.employee_id AS "employeeId",e.employee_code AS "employeeCode",
      CONCAT_WS(' ',e.first_name,e.last_name) AS "employeeName",
      i.base_salary AS "baseSalary",i.bonuses,i.deductions,i.net_salary AS "netSalary",
      i.payment_status AS "paymentStatus"
     FROM payroll_items i JOIN employees e ON e.id=i.employee_id
     WHERE i.payroll_period_id=$1 ORDER BY e.last_name,e.first_name`, [periodId],
  );
  response.status(201).json({ data: result.rows });
}));

payrollRouter.patch('/items/:id/payment', asyncHandler(async (request, response) => {
  const itemId = periodIdSchema.parse(request.params.id);
  const paymentStatus = z.enum(['pending','paid']).parse(request.body.paymentStatus);
  const result = await pool.query(
    `UPDATE payroll_items i SET payment_status=$1,paid_at=CASE WHEN $1='paid' THEN NOW() ELSE NULL END
     WHERE i.id=$2 AND EXISTS(SELECT 1 FROM payroll_periods p WHERE p.id=i.payroll_period_id AND p.status='draft')
     RETURNING i.id,i.payment_status AS "paymentStatus",i.paid_at AS "paidAt"`,
    [paymentStatus,itemId],
  );
  if (!result.rowCount) { response.status(404).json({ error: 'Payroll item not found or period is locked.' }); return; }
  response.json({ data: result.rows[0] });
}));
