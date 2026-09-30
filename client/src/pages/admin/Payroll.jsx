import { useEffect, useMemo, useState } from 'react';
import api, { downloadPayslip } from '../../api';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiFileText,
  FiRefreshCw,
  FiUser,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';

import { FaRupeeSign } from 'react-icons/fa';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const now = new Date();

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const num = (value) => Number(value) || 0;

export default function Payroll() {
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const [form, setForm] = useState({
    employee_id: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    allowances: 0,
  });

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  const loadEmployees = async () => {
    const response = await api.get('/employees');

    const activeEmployees = (
      Array.isArray(response.data)
        ? response.data
        : []
    ).filter(
      (employee) =>
        employee.role === 'employee' &&
        employee.is_active !== false
    );

    setEmployees(activeEmployees);

    setForm((prev) => {
      if (
        prev.employee_id ||
        activeEmployees.length === 0
      ) {
        return prev;
      }

      return {
        ...prev,
        employee_id: String(
          activeEmployees[0].id
        ),
      };
    });
  };

  // =========================================================
  // LOAD PAYSLIPS
  // =========================================================

  const loadPayslips = async () => {
    const response = await api.get('/payslips');

    setPayslips(
      Array.isArray(response.data)
        ? response.data
        : []
    );
  };

  const loadAll = async (refresh = false) => {
    try {
      setError('');

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      await Promise.all([
        loadEmployees(),
        loadPayslips(),
      ]);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to load payroll data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // =========================================================
  // SELECTED EMPLOYEE
  // =========================================================

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          String(employee.id) ===
          String(form.employee_id)
      ),
    [employees, form.employee_id]
  );

  // =========================================================
  // EXISTING PAYSLIP
  // =========================================================

  const existingPayslip = useMemo(() => {
    if (!form.employee_id) return null;

    return (
      payslips.find(
        (payslip) =>
          String(payslip.employee_id) ===
            String(form.employee_id) &&
          Number(payslip.month) ===
            Number(form.month) &&
          Number(payslip.year) ===
            Number(form.year)
      ) || null
    );
  }, [
    payslips,
    form.employee_id,
    form.month,
    form.year,
  ]);

  // =========================================================
  // WHEN EMPLOYEE / PERIOD CHANGES
  // ONLY MONTHLY EXTRA VALUES COME FROM EXISTING PAYSLIP
  // EPF + PROFESSIONAL TAX ALWAYS COME FROM EMPLOYEE
  // =========================================================

  useEffect(() => {
    if (!selectedEmployee) return;

    setForm((prev) => ({
      ...prev,

      allowances: existingPayslip
        ? num(existingPayslip.allowances)
        : 0,
    }));
  }, [
    selectedEmployee,
    existingPayslip,
  ]);

  // =========================================================
  // EMPLOYEE SALARY STRUCTURE
  // =========================================================

  const salary = useMemo(() => {
    if (!selectedEmployee) {
      return {
        basic: 0,
        hra: 0,
        special_allowance: 0,
        lta: 0,
        other_allowances: 0,
        epf: 0,
        professional_tax: 0,
      };
    }

    return {
      basic: num(selectedEmployee.basic),
      hra: num(selectedEmployee.hra),
      special_allowance: num(
        selectedEmployee.special_allowance
      ),
      lta: num(selectedEmployee.lta),
      other_allowances: num(
        selectedEmployee.other_allowances
      ),
      epf: num(selectedEmployee.epf),
      professional_tax: num(
        selectedEmployee.professional_tax
      ),
    };
  }, [selectedEmployee]);

  // =========================================================
  // CALCULATION
  // =========================================================

  const calculation = useMemo(() => {
    const gross =
      salary.basic +
      salary.hra +
      salary.special_allowance +
      salary.lta +
      salary.other_allowances +
      num(form.allowances);

    const totalDeductions =
      salary.epf +
      salary.professional_tax;

    const netPay =
      gross - totalDeductions;

    return {
      gross,
      totalDeductions,
      netPay,
    };
  }, [salary, form.allowances]);

  // =========================================================
  // CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setMessage('');

    if (name === 'employee_id') {
      setForm((prev) => ({
        ...prev,
        employee_id: value,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        value === '' ? '' : Number(value),
    }));
  };

  // =========================================================
  // GENERATE / UPDATE
  // =========================================================

  const handleGenerate = async (event) => {
    event.preventDefault();

    const mode =
      event?.nativeEvent?.submitter?.value ===
      'update'
        ? 'update'
        : 'generate';

    setError('');
    setMessage('');

    if (
      mode === 'update' &&
      !form.employee_id
    ) {
      setError(
        'Please select an employee to update.'
      );
      return;
    }

    if (num(form.allowances) < 0) {
      setError(
        'Additional allowance cannot be negative.'
      );
      return;
    }

    if (
      form.employee_id &&
      !selectedEmployee
    ) {
      setError('Employee details not found.');
      return;
    }

    if (
      form.employee_id &&
      num(selectedEmployee.basic) <= 0
    ) {
      setError(
        'This employee does not have a Basic Salary. Please update the employee salary structure first.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        '/payslips/generate',
        {
          employee_id: form.employee_id
            ? Number(form.employee_id)
            : null,
          month: Number(form.month),
          year: Number(form.year),
          mode,

          // Only monthly adjustments are entered here.
          allowances: num(form.allowances),
          deductions: 0,
        }
      );

      await loadPayslips();

      setMessage(
        response?.data?.message ||
          (mode === 'update'
            ? 'Payslip updated successfully.'
            : 'Payslips generated successfully.')
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to generate payslip.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DOWNLOAD
  // =========================================================

  const handleDownload = async (id) => {
    try {
      setDownloadError('');
      setDownloadingId(id);

      await downloadPayslip(id);
    } catch (err) {
      setDownloadError(
        err?.response?.data?.message ||
          'Failed to download payslip.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================================================
  // SORT
  // =========================================================

  const sortedPayslips = useMemo(
    () =>
      [...payslips].sort(
        (a, b) =>
          Number(b.year) - Number(a.year) ||
          Number(b.month) - Number(a.month)
      ),
    [payslips]
  );

  const totalNetPay = payslips.reduce(
    (sum, payslip) =>
      sum + num(payslip.net_pay),
    0
  );

  return (
    <div className="payroll-page">
      <style>{`
        .payroll-page {
          width: 100%;
          max-width: 1450px;
          margin: 0 auto;
          padding-bottom: 40px;
          color: #0f172a;
        }

        .payroll-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .payroll-header-left {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .header-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-icon svg {
          width: 24px;
          height: 24px;
        }

        .payroll-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 750;
        }

        .payroll-header p {
          margin: 7px 0 0;
          color: #64748b;
          font-size: 14px;
        }

        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 14px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: white;
          color: #334155;
          font-weight: 650;
          cursor: pointer;
        }

        .refresh-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .spin {
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .summary-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 5px 18px rgba(15,23,42,.04);
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
        }

        .summary-label {
          margin-top: 12px;
          color: #64748b;
          font-size: 12px;
          font-weight: 600;
        }

        .summary-value {
          margin-top: 4px;
          font-size: 21px;
          font-weight: 750;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          gap: 18px;
          margin-bottom: 20px;
        }

        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 5px 18px rgba(15,23,42,.035);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 18px 20px;
          border-bottom: 1px solid #eef2f7;
        }

        .card-header-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-header h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 720;
        }

        .card-header p {
          margin: 3px 0 0;
          color: #94a3b8;
          font-size: 11px;
        }

        .form-body {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .full {
          grid-column: 1 / -1;
        }

        .form-group label {
          display: block;
          margin-bottom: 7px;
          color: #475569;
          font-size: 12px;
          font-weight: 650;
        }

        .form-input,
        .form-select {
          width: 100%;
          height: 43px;
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: white;
          color: #0f172a;
          outline: none;
          font-size: 13px;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(37,99,235,.1);
        }

        .form-input.readonly {
          background: #f8fafc;
          color: #475569;
          cursor: not-allowed;
        }

        .section-title {
          grid-column: 1 / -1;
          margin-top: 4px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eef2f7;
          font-size: 13px;
          font-weight: 750;
          color: #1e293b;
        }

        .salary-grid {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .salary-box {
          padding: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }

        .salary-box span {
          display: block;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .salary-box strong {
          display: block;
          margin-top: 5px;
          color: #1e293b;
          font-size: 13px;
        }

        .source-note {
          grid-column: 1 / -1;
          padding: 10px 12px;
          border-radius: 9px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          line-height: 1.5;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #eef2f7;
        }

        .generate-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 43px;
          padding: 0 18px;
          border: 0;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-weight: 700;
          cursor: pointer;
        }

        .generate-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .message {
          margin-bottom: 16px;
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 12px;
        }

        .success {
          background: #ecfdf5;
          color: #047857;
        }

        .error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .preview-body {
          padding: 20px;
        }

        .employee-card {
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          background: #f8fbff;
          margin-bottom: 16px;
        }

        .employee-top {
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #dbeafe;
          color: #2563eb;
        }

        .employee-card strong {
          display: block;
          font-size: 13px;
        }

        .employee-card span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 11px;
        }

        .source-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 10px;
          padding: 5px 8px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #047857;
          font-size: 10px;
          font-weight: 700;
        }

        .existing {
          margin-bottom: 14px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 10px;
          font-weight: 700;
        }

        .calc-list {
          border-top: 1px solid #eef2f7;
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }

        .calc-row span {
          color: #64748b;
        }

        .calc-row strong {
          color: #334155;
        }

        .gross strong {
          color: #2563eb;
        }

        .deduction strong {
          color: #dc2626;
        }

        .net-box {
          margin-top: 15px;
          padding: 15px;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          background: #ecfdf5;
        }

        .net-box small {
          color: #047857;
          font-weight: 700;
        }

        .net-box strong {
          display: block;
          margin-top: 4px;
          color: #047857;
          font-size: 24px;
        }

        .list-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid #eef2f7;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        th {
          padding: 12px 18px;
          background: #f8fafc;
          color: #64748b;
          font-size: 10px;
          text-align: left;
          text-transform: uppercase;
        }

        td {
          padding: 14px 18px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }

        .net-pay {
          color: #047857;
          font-weight: 750;
        }

                .download-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 32px;
          padding: 0 10px;
          border: 1px solid #dbe3ef;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          transition: all .2s ease;
        }

        .download-btn:hover {
          color: #2563eb;
          border-color: #93c5fd;
          background: #eff6ff;
        }

        .download-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .download-btn svg {
          width: 14px;
          height: 14px;
        }

        .download-error {
          margin: 14px 18px;
          padding: 10px;
          border-radius: 8px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
        }

        .empty {
          padding: 50px 20px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        @media (max-width: 1050px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 750px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .full,
          .salary-grid {
            grid-column: auto;
          }

          .salary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 550px) {
          .payroll-header {
            flex-direction: column;
          }

          .refresh-btn {
            width: 100%;
            justify-content: center;
          }

          .salary-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .generate-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      {/* HEADER */}

      <div className="payroll-header">
        <div className="payroll-header-left">
          <div className="header-icon">
            <FaRupeeSign />
          </div>

          <div>
            <h1>Payroll Generation</h1>
            <p>
              Generate and update monthly
              employee payslips.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={() => loadAll(true)}
          disabled={refreshing}
        >
          <FiRefreshCw
            className={
              refreshing ? 'spin' : ''
            }
          />
          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {/* SUMMARY */}

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon">
            <FiUsers />
          </div>
          <div className="summary-label">
            Active Employees
          </div>
          <div className="summary-value">
            {employees.length}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <FiFileText />
          </div>
          <div className="summary-label">
            Generated Payslips
          </div>
          <div className="summary-value">
            {payslips.length}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">
            <FaRupeeSign />
          </div>
          <div className="summary-label">
            Total Net Pay
          </div>
          <div className="summary-value">
            {money(totalNetPay)}
          </div>
        </div>
      </div>

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {/* GENERATION */}

      <div className="main-grid">
        {/* FORM */}

        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">
              <FiEdit2 />
            </div>

            <div>
              <h2>
                Generate / Update Payslip
              </h2>
              <p>
                Employee salary information is
                fetched from Add Employee.
              </p>
            </div>
          </div>

          <form
            className="form-body"
            onSubmit={handleGenerate}
          >
            {message && (
              <div className="message success">
                {message}
              </div>
            )}

            <div className="form-grid">
              {/* EMPLOYEE */}

              <div className="form-group full">
                <label>
                  Employee
                </label>

                <select
                  name="employee_id"
                  className="form-select"
                  value={form.employee_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Select employee
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.emp_code
                          ? `${employee.emp_code} - `
                          : ''}
                        {employee.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* MONTH */}

              <div className="form-group">
                <label>
                  Salary Month
                </label>

                <select
                  name="month"
                  className="form-select"
                  value={form.month}
                  onChange={handleChange}
                  disabled={saving}
                >
                  {MONTHS.map(
                    (month, index) => (
                      <option
                        key={month}
                        value={index + 1}
                      >
                        {month}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* YEAR */}

              <div className="form-group">
                <label>
                  Salary Year
                </label>

                <input
                  type="number"
                  name="year"
                  className="form-input"
                  min="2000"
                  max="2100"
                  value={form.year}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="section-title">
                Employee Salary Structure
              </div>

              <div className="source-note">
                These values are fetched directly
                from the selected employee's Add
                Employee record.
              </div>

              <div className="salary-grid">
                <div className="salary-box">
                  <span>Basic Salary</span>
                  <strong>
                    {money(salary.basic)}
                  </strong>
                </div>

                <div className="salary-box">
                  <span>HRA</span>
                  <strong>
                    {money(salary.hra)}
                  </strong>
                </div>

                <div className="salary-box">
                  <span>Special Allowance</span>
                  <strong>
                    {money(
                      salary.special_allowance
                    )}
                  </strong>
                </div>

                <div className="salary-box">
                  <span>LTA</span>
                  <strong>
                    {money(salary.lta)}
                  </strong>
                </div>

                <div className="salary-box">
                  <span>Other Allowances</span>
                  <strong>
                    {money(
                      salary.other_allowances
                    )}
                  </strong>
                </div>

                <div className="salary-box">
                  <span>EPF</span>
                  <strong>
                    {money(salary.epf)}
                  </strong>
                </div>

                <div className="salary-box">
                  <span>Professional Tax</span>
                  <strong>
                    {money(
                      salary.professional_tax
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                value="generate"
                className="generate-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FiRefreshCw className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiFileText />
                    {form.employee_id
                      ? 'Generate Payslip'
                      : 'Generate Payslips'}
                  </>
                )}
              </button>

              <button
                type="submit"
                value="update"
                className="generate-btn"
                style={{
                  marginLeft: 10,
                  background: '#10b981',
                }}
                disabled={saving || !form.employee_id}
              >
                <FiEdit2 />
                Update Payslip
              </button>
            </div>
          </form>
        </div>

        {/* PREVIEW */}

        <div className="card">
          <div className="card-header">
            <div className="card-header-icon">
              <FaRupeeSign />
            </div>

            <div>
              <h2>Payroll Preview</h2>
              <p>
                Values fetched from employee
                record.
              </p>
            </div>
          </div>

          <div className="preview-body">
            {!selectedEmployee ? (
              <div className="empty">
                Select an employee to view
                payroll details.
              </div>
            ) : (
              <>
                <div className="employee-card">
                  <div className="employee-top">
                    <div className="avatar">
                      <FiUser />
                    </div>

                    <div>
                      <strong>
                        {selectedEmployee.name}
                      </strong>

                      <span>
                        {selectedEmployee.emp_code ||
                          'Employee'}
                        {selectedEmployee.designation
                          ? ` • ${selectedEmployee.designation}`
                          : ''}
                      </span>
                    </div>
                  </div>

                  <div className="source-badge">
                    <FiCheckCircle />
                    Employee Master Data
                  </div>
                </div>

                {existingPayslip && (
                  <div className="existing">
                    Existing payslip found for{' '}
                    {MONTHS[
                      Number(form.month) - 1
                    ]}{' '}
                    {form.year}. Updating will
                    replace its monthly values.
                  </div>
                )}

                <div className="calc-list">
                  <div className="calc-row">
                    <span>Basic</span>
                    <strong>
                      {money(salary.basic)}
                    </strong>
                  </div>

                  <div className="calc-row">
                    <span>HRA</span>
                    <strong>
                      {money(salary.hra)}
                    </strong>
                  </div>

                  <div className="calc-row">
                    <span>Special Allowance</span>
                    <strong>
                      {money(
                        salary.special_allowance
                      )}
                    </strong>
                  </div>

                  <div className="calc-row">
                    <span>LTA</span>
                    <strong>
                      {money(salary.lta)}
                    </strong>
                  </div>

                  <div className="calc-row">
                    <span>Other Allowances</span>
                    <strong>
                      {money(
                        salary.other_allowances
                      )}
                    </strong>
                  </div>

                  <div className="calc-row">
                    <span>
                      Additional Allowance
                    </span>
                    <strong>
                      {money(form.allowances)}
                    </strong>
                  </div>

                  <div className="calc-row gross">
                    <span>
                      Gross Earnings
                    </span>
                    <strong>
                      {money(
                        calculation.gross
                      )}
                    </strong>
                  </div>

                  <div className="calc-row deduction">
                    <span>EPF</span>
                    <strong>
                      -{money(salary.epf)}
                    </strong>
                  </div>

                  <div className="calc-row deduction">
                    <span>
                      Professional Tax
                    </span>
                    <strong>
                      -{money(
                        salary.professional_tax
                      )}
                    </strong>
                  </div>

                  <div className="calc-row deduction">
                    <span>
                      Total Deductions
                    </span>
                    <strong>
                      -{money(
                        calculation.totalDeductions
                      )}
                    </strong>
                  </div>
                </div>

                <div className="net-box">
                  <small>NET PAY</small>

                  <strong>
                    {money(calculation.netPay)}
                  </strong>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* GENERATED PAYSLIPS */}

      <div className="list-card">
        <div className="list-header">
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 15,
              }}
            >
              Generated Payslips
            </h2>

            <p
              style={{
                margin: '3px 0 0',
                color: '#94a3b8',
                fontSize: 11,
              }}
            >
              Previously generated employee
              payslips
            </p>
          </div>

          <strong>
            {payslips.length}
          </strong>
        </div>

        {downloadError && (
          <div className="download-error">
            {downloadError}
          </div>
        )}

        {loading ? (
          <div className="empty">
            Loading payslips...
          </div>
        ) : sortedPayslips.length === 0 ? (
          <div className="empty">
            No payslips generated yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Basic</th>
                  <th>EPF</th>
                  <th>Professional Tax</th>
                  <th>Net Pay</th>
                  <th>PDF</th>
                </tr>
              </thead>

              <tbody>
                {sortedPayslips.map(
                  (payslip) => (
                    <tr key={payslip.id}>
                      <td>
                        <strong>
                          {payslip.name ||
                            'Employee'}
                        </strong>
                        <div
                          style={{
                            color: '#94a3b8',
                            fontSize: 10,
                            marginTop: 3,
                          }}
                        >
                          {payslip.emp_code ||
                            `ID ${payslip.employee_id}`}
                        </div>
                      </td>

                      <td>
                        {MONTHS[
                          Number(payslip.month) -
                            1
                        ]}{' '}
                        {payslip.year}
                      </td>

                      <td>
                        {money(payslip.basic)}
                      </td>

                      <td>
                        {money(payslip.epf)}
                      </td>

                      <td>
                        {money(
                          payslip.professional_tax
                        )}
                      </td>

                      <td>
                        <span className="net-pay">
                          {money(
                            payslip.net_pay
                          )}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="download-btn"
                          onClick={() =>
                            handleDownload(
                              payslip.id
                            )
                          }
                          disabled={
                            downloadingId ===
                            payslip.id
                          }
                        >
                          {downloadingId ===
                          payslip.id ? (
                            <>
                              <FiClock />
                              Downloading
                            </>
                          ) : (
                            <>
                              <FiDownload />
                              Download
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}