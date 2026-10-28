import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';

export const departmentsRouter = Router();

const createDepartmentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(5000).optional().nullable(),
  monthlyBudget: z.number().finite().min(0).default(0),
});

departmentsRouter.get('/', asyncHandler(async (_request, response) => {
  const result = await pool.query(
    `SELECT d.id, d.name, d.description, d.monthly_budget AS "monthlyBudget",
            d.created_at AS "createdAt", d.updated_at AS "updatedAt",
            COUNT(e.id)::int AS "employeeCount"
     FROM departments d
     LEFT JOIN employees e ON e.department_id = d.id
     GROUP BY d.id
     ORDER BY d.name ASC`,
  );
  response.json({ data: result.rows });
}));

departmentsRouter.post('/', asyncHandler(async (request, response) => {
  const input = createDepartmentSchema.parse(request.body);
  const result = await pool.query(
    `INSERT INTO departments (name, description, monthly_budget)
     VALUES ($1, $2, $3)
     RETURNING id, name, description, monthly_budget AS "monthlyBudget",
               created_at AS "createdAt", updated_at AS "updatedAt"`,
    [input.name, input.description ?? null, input.monthlyBudget],
  );
  response.status(201).json({ data: result.rows[0] });
}));