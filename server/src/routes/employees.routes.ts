import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const employeesRouter = Router();

const employeeSchema = z.object({
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
  address: z.string().trim().max(1000).optional().nullable(),
  contractType: z.enum(['permanent', 'fixed_term', 'part_time', 'internship', 'freelance']).default('permanent'),
  workSchedule: z.enum(['full_time', 'part_time', 'shift']).default('full_time'),
  notes: z.string().trim().max(5000).optional().nullable(),
});
const employeeSelect = `SELECT e.id, e.employee_code AS "employeeCode", e.first_name AS "firstName",
  e.last_name AS "lastName", e.email, e.phone, e.department_id AS "departmentId",
  d.name AS "departmentName", e.position, e.hire_date AS "hireDate",
  e.base_salary AS "baseSalary", e.employment_status AS "employmentStatus",
  e.address, e.contract_type AS "contractType", e.work_schedule AS "workSchedule", e.notes,
  e.created_at AS "createdAt", e.updated_at AS "updatedAt"
  FROM employees e LEFT JOIN departments d ON d.id = e.department_id`;

employeesRouter.get('/', asyncHandler(async (request, response) => {
  const status = request.query.status;
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
  const values: unknown[] = [];
  const filters: string[] = [];
  if (typeof status === 'string' && ['active', 'on_leave', 'inactive'].includes(status)) {
    values.push(status); filters.push(`e.employment_status = $${values.length}`);
  }
  if (query) {
    values.push(`%${query}%`);
    filters.push(`(e.employee_code ILIKE $${values.length} OR e.first_name ILIKE $${values.length} OR e.last_name ILIKE $${values.length} OR e.email ILIKE $${values.length} OR e.position ILIKE $${values.length} OR d.name ILIKE $${values.length})`);
  }
  const result = await pool.query(`${employeeSelect}
    ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''}
    ORDER BY e.last_name, e.first_name`, values);
  response.json({ data: result.rows });
}));

employeesRouter.post('/', asyncHandler(async (request, response) => {
  const input = employeeSchema.parse(request.body);
  const result = await pool.query(
    `INSERT INTO employees
      (employee_code, first_name, last_name, email, phone, department_id, position, hire_date,
       base_salary, employment_status, address, contract_type, work_schedule, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id, employee_code AS "employeeCode", first_name AS "firstName", last_name AS "lastName",
       email, phone, department_id AS "departmentId", position, hire_date AS "hireDate",
       base_salary AS "baseSalary", employment_status AS "employmentStatus", address,
       contract_type AS "contractType", work_schedule AS "workSchedule", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.employeeCode, input.firstName, input.lastName, input.email ?? null, input.phone ?? null,
      input.departmentId ?? null, input.position, input.hireDate ?? null, input.baseSalary,
      input.employmentStatus, input.address ?? null, input.contractType, input.workSchedule, input.notes ?? null],
  );
  response.status(201).json({ data: result.rows[0] });
}));

employeesRouter.put('/:id', asyncHandler(async (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  const input = employeeSchema.parse(request.body);
  const result = await pool.query(
    `UPDATE employees SET employee_code=$1, first_name=$2, last_name=$3, email=$4, phone=$5,
      department_id=$6, position=$7, hire_date=$8, base_salary=$9, employment_status=$10,
      address=$11, contract_type=$12, work_schedule=$13, notes=$14, updated_at=NOW()
     WHERE id=$15
     RETURNING id, employee_code AS "employeeCode", first_name AS "firstName", last_name AS "lastName",
       email, phone, department_id AS "departmentId", position, hire_date AS "hireDate",
       base_salary AS "baseSalary", employment_status AS "employmentStatus", address,
       contract_type AS "contractType", work_schedule AS "workSchedule", notes, created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.employeeCode, input.firstName, input.lastName, input.email ?? null, input.phone ?? null,
      input.departmentId ?? null, input.position, input.hireDate ?? null, input.baseSalary,
      input.employmentStatus, input.address ?? null, input.contractType, input.workSchedule, input.notes ?? null, id],
  );
  if (!result.rowCount) { response.status(404).json({ error: 'Employee not found' }); return; }
  response.json({ data: result.rows[0] });
}));

employeesRouter.delete('/:id', asyncHandler(async (request, response) => {
  const id = z.coerce.number().int().positive().parse(request.params.id);
  const result = await pool.query('DELETE FROM employees WHERE id=$1 RETURNING id', [id]);
  if (!result.rowCount) { response.status(404).json({ error: 'Employee not found' }); return; }
  response.status(204).end();
}));
