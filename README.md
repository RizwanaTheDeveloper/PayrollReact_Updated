# PayrollReact — Updated working structure

This package reorganizes the public `RizwanaTheDeveloper/PayrollReact` project into the modular React + Flask structure requested earlier, while keeping the existing payroll concepts: employee CRUD, login/session roles, payroll calculation, Indian tax calculation, payroll history, payslip preview and optional PDF download.

## Folder structure

```text
PayrollReact/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── auth/
│   │   ├── routes.py
│   │   └── service.py
│   ├── employees/
│   │   ├── routes.py
│   │   └── service.py
│   ├── payroll/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── history.py
│   │   └── tax_engine.py
│   ├── payslips/
│   │   ├── routes.py
│   │   └── service.py
│   ├── utils/
│   │   └── validators.py
│   ├── templates/
│   │   └── payroll.html
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   ├── EmployeeForm.jsx
│       │   ├── EmployeeTable.jsx
│       │   ├── Modal.jsx
│       │   ├── Layout.jsx
│       │   └── PasswordInput.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Employees.jsx
│       │   ├── Payroll.jsx
│       │   ├── Payslip.jsx
│       │   ├── PayslipHistory.jsx
│       │   └── NotFound.jsx
│       ├── services/
│       │   └── api.js
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ToastContext.jsx
│       ├── utils/
│       │   ├── validation.js
│       │   ├── format.js
│       │   └── constants.js
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
└── README.md
```

## Run locally

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and set your PostgreSQL `DATABASE_URL` and a real `FLASK_SECRET_KEY`.

Then:

```bash
python app.py
```

Backend: `http://127.0.0.1:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Vite proxies `/api`, `/generate-payroll`, and `/download-payslip` to Flask.

### 3. PDF downloads

The browser-based PDF route is optional because it requires Chromium:

```bash
playwright install chromium
```

Then set:

```env
PLAYWRIGHT_PDF=1
```

Without it, the main React payroll application still runs; the PDF endpoint returns a clear configuration error instead of silently failing.

## Database expectations

The existing source code expects PostgreSQL tables named `Employees`, `AppUsers`, and `PayrollHistory`, with the columns referenced by the services. This package does not invent a database schema or sample credentials because those were not present in the GitHub source used for the conversion.

## Important source-preservation note

The GitHub README itself says its `database.py` was a placeholder and that Add/Edit Employee and Payslip History had not yet been built in that repository. This package fills those React UI gaps and keeps the database connection based on `DATABASE_URL`/psycopg, but it does not fabricate a database schema or login password.

The tax engine remains the repository's FY 2025-26 / AY 2026-27 logic; update the tax module separately when your payroll rules change.
