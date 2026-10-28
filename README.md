# Finance & Payroll Dashboard

Responsive React + TypeScript + Vite frontend with a separate Node.js/Express API and PostgreSQL database.

## Project structure

- `src/` — current React frontend (some screens still use demo data).
- `server/src/config/` — environment validation and PostgreSQL connection pool.
- `server/src/routes/` — API routes for health, departments, employees, payroll and transactions.
- `server/src/middleware/` — centralized API error handling.
- `database/migrations/` — versioned SQL schema migrations.
- `server/.env.example` — local API configuration template.

## Requirements

- Node.js 20+
- npm
- PostgreSQL 18 (or a compatible supported PostgreSQL version)

## 1. Configure the database

The application database is named `hani-model-1`, hosted locally at `localhost:5432`.

If the database has not been created yet, create it once as the PostgreSQL administrator:

```sql
CREATE DATABASE "hani-model-1" WITH OWNER = postgres ENCODING = 'UTF8';
```

Apply the initial schema from the repository root in PowerShell. Enter your PostgreSQL password only when prompted:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h localhost -p 5432 -U postgres -d "hani-model-1" -W -v ON_ERROR_STOP=1 -f "database/migrations/001_initial_schema.sql"
```

This migration creates the application's departments, employees, payroll periods and items, transactions, company cards, budgets, and dues tables. It does not connect to or alter the other databases on your machine.

## 2. Configure and start the API

Open a PowerShell terminal at the project root:

```powershell
Copy-Item server/.env.example server/.env
notepad server/.env
```

Set `DB_PASSWORD` in `server/.env` to your local PostgreSQL password. Keep this file private; it is ignored by Git.

Then install and start the API:

```powershell
Set-Location server
npm install
npm run dev
```

The API listens on `http://localhost:3001`. Test the connection by opening [http://localhost:3001/api/health](http://localhost:3001/api/health). A successful response includes the connected database name.

Available initial endpoints:

- `GET /api/health`
- `GET /api/departments` and `POST /api/departments`
- `GET /api/employees` and `POST /api/employees`
- `GET /api/payroll/summary`
- `GET /api/payroll/periods` and `POST /api/payroll/periods`
- `GET /api/transactions`

## 3. Start the frontend

In a second PowerShell terminal opened at the project root, run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

**Note:** The current frontend still contains demo data. The API and schema are the first integration phase; the screens must be connected to the API before the dashboard displays live database records.

## Production build

Frontend:

```powershell
npm run build
```

API type-check/build:

```powershell
Set-Location server
npm run typecheck
npm run build
```

## Security

- Never commit `server/.env` or publish your database password.
- Keep the PostgreSQL server bound to the appropriate local/private interface.
- Do not store card numbers or other payment credentials in this application.
