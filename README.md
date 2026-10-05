# Payroll Management System (PERN)

## Setup
1. Start PostgreSQL and set `DATABASE_URL`, `JWT_SECRET`, and admin credentials in `server/.env`.
2. In `server`, run `npm install`, then `npm run db:init`. This reads `server/.env`, creates the configured database if missing (requires database creation privileges), and applies `src/schema.sql` in a transaction. It works on Windows without `psql` and can be rerun without deleting existing records.
3. Run `npm run seed` to create the configured login accounts, then `npm run dev` (API on :5000).
4. In `client`, run `npm install`, then `npm run dev` (UI on :5173, proxies /api to :5000).

The database contains `employees` (including login accounts and salary structure), `payslips`, `attendance`, and `leaves`. In pgAdmin, refresh the database list and open the database named in `DATABASE_URL` → Schemas → public → Tables.

If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands (for example, `npm.cmd run db:init`).

Login with the admin email/password from `.env`, then add employees from the admin dashboard.

## Employee loans
Open **Employee → Loans** to send a loan request and track its approval, payment, balance and payroll recovery history. Employees can access only their own requests. Open **Admin → Loans** to review and approve or reject employee requests, then record actual disbursements with payment references. Administrators cannot submit loan requests. The register includes outstanding balances, monthly recovery, a detail panel, projected instalments and an activity history. Recovery can be paused or resumed by an administrator with a recorded reason.

Run `npm.cmd run db:init` in `server` when updating an existing installation. Active, disbursed loans are recovered automatically when eligible payslips are generated, starting in the configured recovery month. The final instalment collects the remaining balance, including any rounding remainder. Updating a payslip preserves its recorded recovery; deleting it restores that balance. The payroll register links each recorded recovery to its loan. Existing employee master advances keep their joining-month deduction behavior.

Run `npm.cmd run test:loans` in `server` for the loans and payroll integration checks. They use an isolated database schema and remove it after completion.

Employees enter a monthly flat interest percentage (0-100%, up to two decimals) and a number of instalments (1-360). Interest for each instalment is calculated on the original principal, rounded to paise, and multiplied by the instalment count. INR 10,000 at 2% for 10 instalments means INR 200 monthly interest, INR 12,000 total repayment, and INR 1,200 deducted from net salary for each of 10 months. Monthly principal is rounded down to paise; the final instalment collects any remaining principal. Payroll and PDF payslips show Loan repayment (incl. interest) in deductions. Existing loans and legacy API requests without an instalment count retain their original one-time interest terms.
