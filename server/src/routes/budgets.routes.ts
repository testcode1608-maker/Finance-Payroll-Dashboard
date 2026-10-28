import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';
export const budgetsRouter = Router();
const schema=z.object({departmentId:z.number().int().positive(),monthStart:z.string().date().refine(v=>v.endsWith('-01'),{message:'La date doit être le premier jour du mois.'}),amount:z.number().finite().min(0)});
budgetsRouter.get('/',asyncHandler(async(_req,res)=>{const r=await pool.query('SELECT b.id,b.department_id AS "departmentId",d.name AS "departmentName",b.month_start AS "monthStart",b.amount,b.created_at AS "createdAt" FROM budgets b JOIN departments d ON d.id=b.department_id ORDER BY b.month_start DESC,d.name');res.json({data:r.rows});}));
budgetsRouter.post('/',asyncHandler(async(req,res)=>{const x=schema.parse(req.body);const r=await pool.query('INSERT INTO budgets(department_id,month_start,amount) VALUES($1,$2,$3) ON CONFLICT(department_id,month_start) DO UPDATE SET amount=EXCLUDED.amount RETURNING id,department_id AS "departmentId",month_start AS "monthStart",amount',[x.departmentId,x.monthStart,x.amount]);res.status(201).json({data:r.rows[0]});}));
budgetsRouter.delete('/:id',asyncHandler(async(req,res)=>{const id=z.coerce.number().int().positive().parse(req.params.id);const r=await pool.query('DELETE FROM budgets WHERE id=$1 RETURNING id',[id]);if(!r.rowCount){res.status(404).json({error:'Budget not found'});return;}res.status(204).end();}));
