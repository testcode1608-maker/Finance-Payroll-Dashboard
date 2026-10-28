import { app } from './app.js';
import { pool, verifyDatabaseConnection } from './config/database.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  await verifyDatabaseConnection();
  const server = app.listen(env.PORT, '127.0.0.1', () => {
    console.info(`Finance & Payroll API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    console.info(`${signal} received; shutting down API server`);
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error: unknown) => {
  console.error('Unable to start API server:', error);
  process.exit(1);
});