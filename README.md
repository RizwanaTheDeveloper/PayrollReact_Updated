# Payroll Management System (PERN)

## Setup
1. Start PostgreSQL and set `DATABASE_URL`, `JWT_SECRET`, and admin credentials in `server/.env`.
2. In `server`, run `npm install`, then `npm run db:init`. This reads `server/.env`, creates the configured database if missing (requires database creation privileges), and applies `src/schema.sql` in a transaction. It works on Windows without `psql` and can be rerun without deleting existing records.
3. Run `npm run seed` to create the configured login accounts, then `npm run dev` (API on :5000).
4. In `client`, run `npm install`, then `npm run dev` (UI on :5173, proxies /api to :5000).

The database contains `employees` (including login accounts and salary structure), `payslips`, `attendance`, and `leaves`. In pgAdmin, refresh the database list and open the database named in `DATABASE_URL` → Schemas → public → Tables.

If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands (for example, `npm.cmd run db:init`).

Login with the admin email/password from `.env`, then add employees from the admin dashboard.

## Leave medical documents

Employees can attach optional medical documents while applying for leave: up to three PDF, JPG, or PNG files, each no larger than 5 MB. Admins can open and download the documents from the leave request's Reason cell. Employees can also view their own attachments in their leave history, including on mobile.

The `leave_documents` table stores filenames, file types, sizes, and the actual file contents (`BYTEA`), linked to `leaves` through `leave_id`. Requests and their documents are saved in one transaction. Document access requires login and is limited to admins and the employee who submitted the request.

For an existing installation, run `npm.cmd install` and `npm.cmd run db:init` in `server` before restarting the API. Run `npm.cmd run test:leaves` to verify uploads, document access, rejection reasons, and the leave/payroll flow in an isolated database schema.

## Individual employee reports

Employees can open **Employee → Reports** to view their own monthly attendance, leave, salary, deductions, loans, advances and payment information, with CSV and Print / Save PDF options. `/api/reports/my` scopes every source query to the employee ID from the signed login token; supplied employee IDs are ignored. Company reports remain administrator-only. **Employee → Settings** shows account information, permitted access and links to personal payroll, attendance and request updates.

Open **Admin → Reports → Employee reports** for a monthly table of employee IDs, names, attendance and leave counts, approved credit balances, and net pay. Open an employee's name or **View report** for their individual page with attendance records, leave requests and rejection reasons, payroll components and deductions, loans, salary advances, and decision activity. The selected month is preserved when moving between reports. Search and department filters, CSV exports, and Print / Save PDF are available.

Reports use existing database records. Attendance and leave counts cover the selected month; loan and advance request counts and repayments run through that month. Decision statuses reflect current records. Missing payslips show no salary amount, and unmarked attendance is excluded from unpaid day counts.

## Payroll review, salary history and payments

For an existing installation, run `npm.cmd run db:init` in `server`, then restart the API. The migration adds salary versions, payroll workflow/payment fields, calculation snapshots and an audit log. Existing payslip amounts are preserved; their initial workflow status is Draft and no salary payment is inferred.

Monthly earnings use calendar days: each salary component is weighted by the employee's employment dates and the salary version effective on each day. Unpaid leave is deducted at that day's salary rate. The existing leave allowance is retained; additional allowances, EPF and professional tax remain fixed monthly amounts rather than being automatically prorated. Unmarked attendance does not automatically reduce salary.

When changing salary components in **Employees**, provide an effective date and a reason. **Salary history** shows dated versions and who entered them. A second version on the same effective date is rejected to preserve history. Opening versions reflect the salary structure available when tracking was enabled; salary changes made before tracking cannot be reconstructed automatically. Verify historical salary versions before regenerating old payroll.

Use the **Monthly payroll checklist** to review missing salary, pending leave, elapsed weekday attendance gaps and missing punches. Attendance gaps use Monday–Friday as an advisory baseline; company holidays and alternative work schedules need review. **Payroll Preview** uses the same calculation as generation, including date proration, salary versions and deductions.

Payroll progresses **Draft → Reviewed → Finalized** from **Manage payroll**. Updates return reviewed payroll to Draft. Finalized payslips reject edits and deletion. Reopening requires a correction reason, and the audit log retains previous and updated values. Finalization checks for changed calculations and unresolved leave. Deductions exceeding 50% of gross earnings require acknowledgement; negative take-home pay is blocked during generation.

Once a payslip is finalized, record the date and transaction reference of a salary payment already made. This records payment status; it does not transfer funds. Reversing a payment record requires a reason before reopening payroll. Payment reports, employee monthly reports and CSV exports include recorded payment details. PDFs include workflow status, employment/paid days and separate unpaid-leave/additional deductions.

Inactive accounts and accounts with changed roles lose API access immediately, even if their JWT has not expired. The client returns expired or revoked sessions to sign-in.

Run `npm.cmd run test:payroll` for isolated payroll checks, alongside `test:loans`, `test:advances`, `test:leaves` and `test:reports`.

## Salary advances

Use **Admin → Advances** for the employee register, including employee IDs, names, approved advance balances, and pending amounts. **Add advance** saves an approved advance directly for a selected active employee; saving it requires no separate approval. Employees use **Employee → Advances** to request an advance and follow its status. Employee requests require admin approval or rejection with a reason, visible in the employee's decision history.

Salary advances are interest-free and recovered in one deduction from the selected recovery month or a later generated payroll. Pending and rejected requests are excluded from payroll. The database stores salary advances in `advances` with `record_type = 'salary_advance'`, while existing loans retain `record_type = 'loan'`. Decisions are saved in `advance_events`, and payroll deductions in `advance_recoveries`. Existing employee-record advances are displayed separately as earlier advances.

For an existing installation, run `npm.cmd run db:init` in `server`, then restart the API and refresh the client. Run `npm.cmd run test:advances` for the request, approval, rejection, access, payroll, and reporting checks.

## Employee loans
Open **Employee → Loans** to send a loan request and track its approval, payment, balance and payroll recovery history. Employees can access only their own requests. Open **Admin → Loans** to review and approve or reject employee requests, then record actual disbursements with payment references. Administrators cannot submit loan requests. The register includes outstanding balances, monthly recovery, a detail panel, projected instalments and an activity history. Recovery can be paused or resumed by an administrator with a recorded reason.

Run `npm.cmd run db:init` in `server` when updating an existing installation. Active, disbursed loans are recovered automatically when eligible payslips are generated, starting in the configured recovery month. The final instalment collects the remaining balance, including any rounding remainder. Updating a payslip preserves its recorded recovery; deleting it restores that balance. The payroll register links each recorded recovery to its loan. Existing employee master advances keep their joining-month deduction behavior.

Run `npm.cmd run test:loans` in `server` for the loans and payroll integration checks. They use an isolated database schema and remove it after completion.

Employees enter a monthly flat interest percentage (0-100%, up to two decimals) and a number of instalments (1-360). Interest for each instalment is calculated on the original principal, rounded to paise, and multiplied by the instalment count. INR 10,000 at 2% for 10 instalments means INR 200 monthly interest, INR 12,000 total repayment, and INR 1,200 deducted from net salary for each of 10 months. Monthly principal is rounded down to paise; the final instalment collects any remaining principal. Payroll and PDF payslips show Loan repayment (incl. interest) in deductions. Existing loans and legacy API requests without an instalment count retain their original one-time interest terms.
