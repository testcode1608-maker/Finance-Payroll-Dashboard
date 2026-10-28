import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { asyncHandler } from '../utils/async-handler.js';
export const cardsRouter = Router();
const schema = z.object({ cardLabel:z.string().trim().min(1).max(100), cardholderName:z.string().trim().min(1).max(200), lastFour:z.string().regex(/^\d{4}$/), spendingLimit:z.number().finite().min(0), currentSpend:z.number().finite().min(0).default(0), status:z.enum(['active','paused']).default('active') });
cardsRouter.get('/', asyncHandler(async (_req,res)=>{const r=await pool.query('SELECT id,card_label AS "cardLabel",cardholder_name AS "cardholderName",last_four AS "lastFour",spending_limit AS "spendingLimit",current_spend AS "currentSpend",status,created_at AS "createdAt" FROM company_cards ORDER BY id DESC');res.json({data:r.rows});}));
cardsRouter.post('/', asyncHandler(async (req,res)=>{const x=schema.parse(req.body);const r=await pool.query('INSERT INTO company_cards(card_label,cardholder_name,last_four,spending_limit,current_spend,status) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,card_label AS "cardLabel",cardholder_name AS "cardholderName",last_four AS "lastFour",spending_limit AS "spendingLimit",current_spend AS "currentSpend",status',[x.cardLabel,x.cardholderName,x.lastFour,x.spendingLimit,x.currentSpend,x.status]);res.status(201).json({data:r.rows[0]});}));
cardsRouter.delete('/:id', asyncHandler(async (req,res)=>{const id=z.coerce.number().int().positive().parse(req.params.id);const r=await pool.query('DELETE FROM company_cards WHERE id=$1 RETURNING id',[id]);if(!r.rowCount){res.status(404).json({error:'Card not found'});return;}res.status(204).end();}));
