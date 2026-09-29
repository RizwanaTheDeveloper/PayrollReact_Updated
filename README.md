# Payroll Management System (PERN)

## Setup
1. Create a PostgreSQL database: `createdb payroll`
2. `cd server && cp .env.example .env` (edit DATABASE_URL, JWT_SECRET, admin credentials)
3. `npm install && npm run db:init && npm run seed && npm run dev`  (API on :5000)
4. `cd client && npm install && npm run dev`  (UI on :5173, proxies /api to :5000)

Login with the admin email/password from `.env`, then add employees from the admin dashboard.
