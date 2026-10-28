import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error);
});

export async function verifyDatabaseConnection(): Promise<void> {
  const result = await pool.query<{ database_name: string; database_user: string }>(
    'SELECT current_database() AS database_name, current_user AS database_user',
  );
  console.info(`PostgreSQL connected: ${result.rows[0].database_name} as ${result.rows[0].database_user}`);
}