import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const employeesRouter = Router();

const createEmployeeSchema = z.object({
  employeeCode: z.string().trim().min(1).max(40),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  position: z.string().trim().min(1).max(120),
  hireDate: z.string().date().optional().nullable(),
  baseSalary: z.number().finite().min(0).default(0),
  employmentStatus: z.enum(['active', 'on_leave', 'inactive']).default('active'),
});

employeesRouter.get('/', asyncHandler(async (request, response) => {
  const status = request.query.status;
  const values: unknown[] = [];
  let statusFilter = '';
  if (typeof status === 'string' && ['active', 'on_leave', 'inactive'].includes(status)) {
    values.push(status);
    statusFilter = 'WHERE e.employment_status = $1';
  }
  const result = await pool.query(
    `SELECT e.id, e.employee_code AS "employeeCode", e.first_name AS "firstName",
            e.last_name AS "lastName", e.email, e.phone, e.department_id AS "departmentId",
            d.name AS "departmentName", e.position, e.hire_date AS "hireDate",
            e.base_salary AS "baseSalary", e.employment_status AS "employmentStatus",
            e.created_at AS "createdAt", e.updated_at AS "updatedAt"
     FROM employees e LEFT JOIN departments d ON d.id = e.department_id
     ${statusFilter} ORDER BY e.last_name, e.first_name`,
    values,
  );
  response.json({ data: result.rows });
}));

employeesRouter.post('/', asyncHandler(async (request, response) => {
  const input = createEmployeeSchema.parse(request.body);
  const result = await pool.query(
    `INSERT INTO employees
       (employee_code, first_name, last_name, email, phone, department_id, position, hire_date, base_salary, employment_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, employee_code AS "employeeCode", first_name AS "firstName",
       last_name AS "lastName", email, phone, department_id AS "departmentId",
       position, hire_date AS "hireDate", base_salary AS "baseSalary",
       employment_status AS "employmentStatus", created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.employeeCode, input.firstName, input.lastName, input.email ?? null,
      input.phone ?? null, input.departmentId ?? null, input.position, input.hireDate ?? null,
      input.baseSalary, input.employmentStatus],
  );
  response.status(201).json({ data: result.rows[0] });
}));