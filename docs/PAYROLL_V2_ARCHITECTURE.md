# Payroll Management System v2

## Product target
A production-oriented payroll platform with two portals:
- Admin / HR / Finance
- Employee Self-Service

The implementation follows the uploaded product specification. The payroll calculation engine stays isolated from presentation and persistence so salary rules can be changed without rewriting UI code.

## Architecture

React + Vite + Tailwind CSS
        |
        | JSON/HTTP
        v
Flask REST API
        |
        +-- Auth / RBAC
        +-- Employee master
        +-- Salary structures
        +-- Attendance
        +-- Leave
        +-- Payroll engine
        +-- Payslips / PDF
        +-- Reports
        +-- Audit logs
        |
        v
Neon PostgreSQL

## Design decisions

### Database
Neon PostgreSQL is the system of record. The backend uses psycopg 3 and parameterized SQL. Connection strings stay in environment variables and are never committed.

### Authentication
Passwords are hashed with bcrypt. Access tokens are signed JWTs. Every protected API endpoint checks both authentication and role/permission.

### Payroll engine
The engine receives:
- employee salary structure
- paid days / LOP
- overtime
- bonuses / arrears
- reimbursements
- configurable deductions
- configurable statutory rules

It returns a deterministic payroll result. Every approved payroll run stores a snapshot, so old payslips do not change when salary rules change later.

### PDF
Payslips are rendered from a server-side HTML template and converted to A4 PDF with Playwright. The API returns the PDF bytes directly with a safe attachment filename.

## MVP implementation order

1. Authentication + RBAC
2. Employee master
3. Department / designation management
4. Salary components + effective-date salary structures
5. Attendance + leave
6. Payroll run / preview / approve / lock
7. Payslips + PDF
8. Employee portal
9. Audit log
10. Reports / exports

Advanced modules then follow:
- reimbursements
- loans / advances
- bonuses / incentives
- salary revisions
- tax declarations / Form 16
- F&F settlement
- payment files / reconciliation
- biometric / ERP integrations

## Security rules

- Never commit .env files or real credentials.
- Rotate any credential that has ever been committed to a public repository.
- Do not expose full Aadhaar, PAN, bank account numbers, or tokens in API responses unless the role and field specifically allow it.
- Never calculate payroll from client-provided totals; the server recalculates from source records.
- Locked payroll runs are immutable except through an explicit privileged reopen action.
- All salary, bank, employee, approval and payroll actions are auditable.
