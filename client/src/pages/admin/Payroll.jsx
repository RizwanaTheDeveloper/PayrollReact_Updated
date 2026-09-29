import { useEffect, useMemo, useState } from 'react';
import api, { downloadPayslip } from '../../api';
import {
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiUsers,
  FiClock,
  FiPlus,
} from 'react-icons/fi';

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

const formatMoney = (value) => {
  const number = Number(value || 0);

  return `₹${number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function Payroll() {
  const now = new Date();

  const [f, setF] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    allowances: 0,
    deductions: 0,
  });

  const [list, setList] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);

      const response = await api.get('/payslips');

      setList(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(error);

      setErr(
        error.response?.data?.message ||
          'Failed to load payslips.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    setBusy(true);
    setErr('');
    setMsg('');

    try {
      const { data } = await api.post(
        '/payslips/generate',
        f
      );

      setMsg(
        data.generated
          ? `${data.generated} payslip(s) generated successfully.`
          : 'No new payslips. They may already exist for this month.'
      );

      await load();
    } catch (error) {
      console.error(error);

      setErr(
        error.response?.data?.message ||
          'Failed to generate payslips.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleChange = (key) => (event) => {
    setF((previous) => ({
      ...previous,
      [key]: Number(event.target.value),
    }));
  };

  const handleDownload = async (id) => {
    try {
      setDownloadingId(id);

      await downloadPayslip(id);
    } catch (error) {
      console.error(error);

      setErr(
        error.response?.data?.message ||
          'Failed to download payslip.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const selectedPeriod = useMemo(() => {
    return `${MONTHS[f.month - 1]} ${f.year}`;
  }, [f.month, f.year]);

  const currentPeriodPayslips = useMemo(() => {
    return list.filter(
      (p) =>
        Number(p.month) === Number(f.month) &&
        Number(p.year) === Number(f.year)
    ).length;
  }, [list, f.month, f.year]);

  return (
    <div className="payroll-page">
      <style>{`
        .payroll-page {
          width: 100%;
          min-width: 0;
          padding: 4px 0 30px;
        }

        .payroll-page *,
        .payroll-page *::before,
        .payroll-page *::after {
          box-sizing: border-box;
        }

        .payroll-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .payroll-title-wrap {
          min-width: 0;
        }

        .payroll-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          color: #0f172a;
          font-size: 26px;
          font-weight: 750;
          line-height: 1.2;
        }

        .payroll-title-icon {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eff6ff;
          color: #2563eb;
          flex-shrink: 0;
        }

        .payroll-subtitle {
          margin: 7px 0 0 52px;
          color: #64748b;
          font-size: 14px;
        }

        .payroll-card {
          width: 100%;
          margin-bottom: 22px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.045);
          overflow: hidden;
        }

        .payroll-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .payroll-card-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .payroll-card-heading-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          flex-shrink: 0;
        }

        .payroll-card-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
        }

        .payroll-card-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .payroll-period-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 8px;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .payroll-card-body {
          padding: 22px;
        }

        .payroll-form-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .payroll-field {
          min-width: 0;
        }

        .payroll-label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 650;
        }

        .payroll-input,
        .payroll-select {
          width: 100%;
          height: 43px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 12px;
          background: #fff;
          color: #0f172a;
          outline: none;
          font-size: 14px;
          transition: 0.18s ease;
        }

        .payroll-input:focus,
        .payroll-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        .payroll-field-icon {
          position: relative;
        }

        .payroll-field-icon svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }

        .payroll-field-icon .payroll-input,
        .payroll-field-icon .payroll-select {
          padding-left: 37px;
        }

        .payroll-generate-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .payroll-generate-info {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #64748b;
          font-size: 12px;
        }

        .payroll-generate-info svg {
          color: #2563eb;
          flex-shrink: 0;
        }

        .payroll-generate-btn {
          min-height: 42px;
          padding: 0 17px;
          border: 0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          font-weight: 650;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.18);
          transition: 0.18s ease;
          white-space: nowrap;
        }

        .payroll-generate-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .payroll-generate-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .payroll-spin {
          animation: payrollSpin 0.8s linear infinite;
        }

        @keyframes payrollSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .payroll-message {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 16px;
          padding: 11px 13px;
          border-radius: 9px;
          font-size: 13px;
        }

        .payroll-message.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .payroll-message.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .payroll-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .payroll-summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 16px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 13px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
        }

        .payroll-summary-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #f1f5f9;
          color: #2563eb;
          flex-shrink: 0;
        }

        .payroll-summary-content {
          min-width: 0;
        }

        .payroll-summary-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
        }

        .payroll-summary-value {
          margin-top: 3px;
          color: #0f172a;
          font-size: 17px;
          font-weight: 750;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .payroll-table-wrapper {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .payroll-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .payroll-table th {
          padding: 13px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.035em;
          text-align: left;
          white-space: nowrap;
        }

        .payroll-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-size: 13px;
          vertical-align: middle;
        }

        .payroll-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .payroll-table tbody tr:hover {
          background: #f8fafc;
        }

        .payroll-table th:nth-child(1),
        .payroll-table td:nth-child(1) {
          width: 36%;
        }

        .payroll-table th:nth-child(2),
        .payroll-table td:nth-child(2) {
          width: 20%;
        }

        .payroll-table th:nth-child(3),
        .payroll-table td:nth-child(3) {
          width: 20%;
        }

        .payroll-table th:nth-child(4),
        .payroll-table td:nth-child(4) {
          width: 24%;
        }

        .payroll-employee {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .payroll-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 34px;
        }

        .payroll-employee-info {
          min-width: 0;
        }

        .payroll-employee-name {
          color: #0f172a;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .payroll-employee-code {
          margin-top: 2px;
          color: #94a3b8;
          font-size: 11px;
        }

        .payroll-period {
          color: #475569;
          font-weight: 600;
          white-space: nowrap;
        }

        .payroll-net-pay {
          color: #0f172a;
          font-weight: 750;
          white-space: nowrap;
        }

        .payroll-download-btn {
          min-height: 34px;
          padding: 0 11px;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #eff6ff;
          color: #2563eb;
          cursor: pointer;
          font-size: 12px;
          font-weight: 650;
          white-space: nowrap;
          transition: 0.18s ease;
        }

        .payroll-download-btn:hover {
          background: #dbeafe;
          border-color: #93c5fd;
        }

        .payroll-download-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .payroll-empty {
          padding: 55px 20px;
          text-align: center;
          color: #64748b;
        }

        .payroll-empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 12px;
          border-radius: 12px;
          background: #f1f5f9;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payroll-empty-title {
          color: #334155;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .payroll-empty-text {
          font-size: 13px;
        }

        .payroll-loading {
          padding: 45px 20px;
          text-align: center;
          color: #64748b;
        }

        .payroll-loading-spinner {
          width: 26px;
          height: 26px;
          margin: 0 auto 10px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: payrollSpin 0.8s linear infinite;
        }

        @media (max-width: 1000px) {
          .payroll-form-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .payroll-title {
            font-size: 22px;
          }

          .payroll-title-icon {
            width: 38px;
            height: 38px;
          }

          .payroll-subtitle {
            margin-left: 48px;
          }

          .payroll-form-grid {
            grid-template-columns: 1fr;
          }

          .payroll-card-body {
            padding: 16px;
          }

          .payroll-card-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .payroll-period-badge {
            align-self: flex-start;
          }

          .payroll-generate-row {
            align-items: stretch;
            flex-direction: column;
          }

          .payroll-generate-btn {
            width: 100%;
          }

          .payroll-summary-grid {
            grid-template-columns: 1fr;
          }

          .payroll-table {
            min-width: 680px;
          }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="payroll-header">
        <div className="payroll-title-wrap">
          <h1 className="payroll-title">
            <span className="payroll-title-icon">
              <FiDollarSign size={21} />
            </span>

            Payroll
          </h1>

          <p className="payroll-subtitle">
            Generate monthly payslips and download them as PDF
          </p>
        </div>
      </div>

      {/* GENERATE PAYSLIPS */}
      <div className="payroll-card">
        <div className="payroll-card-header">
          <div className="payroll-card-heading">
            <div className="payroll-card-heading-icon">
              <FiFileText size={18} />
            </div>

            <div>
              <h3>
                Generate Payslips
              </h3>

              <p>
                Generate payslips for all active employees
              </p>
            </div>
          </div>

          <div className="payroll-period-badge">
            <FiCalendar size={13} />
            {selectedPeriod}
          </div>
        </div>

        <div className="payroll-card-body">
          <div className="payroll-form-grid">
            {/* MONTH */}
            <div className="payroll-field">
              <label className="payroll-label">
                Month
              </label>

              <div className="payroll-field-icon">
                <FiCalendar size={16} />

                <select
                  className="payroll-select"
                  value={f.month}
                  onChange={handleChange('month')}
                >
                  {MONTHS.map((month, index) => (
                    <option
                      key={month}
                      value={index + 1}
                    >
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* YEAR */}
            <div className="payroll-field">
              <label className="payroll-label">
                Year
              </label>

              <div className="payroll-field-icon">
                <FiCalendar size={16} />

                <input
                  type="number"
                  className="payroll-input"
                  value={f.year}
                  onChange={handleChange('year')}
                  min="2000"
                  max="2100"
                />
              </div>
            </div>

            {/* ALLOWANCES */}
            <div className="payroll-field">
              <label className="payroll-label">
                Additional Allowances
              </label>

              <div className="payroll-field-icon">
                <FiPlus size={16} />

                <input
                  type="number"
                  min="0"
                  className="payroll-input"
                  value={f.allowances}
                  onChange={handleChange('allowances')}
                  placeholder="0"
                />
              </div>
            </div>

            {/* DEDUCTIONS */}
            <div className="payroll-field">
              <label className="payroll-label">
                Additional Deductions
              </label>

              <div className="payroll-field-icon">
                <FiDollarSign size={16} />

                <input
                  type="number"
                  min="0"
                  className="payroll-input"
                  value={f.deductions}
                  onChange={handleChange('deductions')}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="payroll-generate-row">
            <div className="payroll-generate-info">
              <FiUsers size={15} />

              <span>
                Payslips will be generated for all active employees.
              </span>
            </div>

            <button
              type="button"
              className="payroll-generate-btn"
              onClick={generate}
              disabled={busy}
            >
              {busy ? (
                <>
                  <FiRefreshCw
                    size={16}
                    className="payroll-spin"
                  />
                  Generating...
                </>
              ) : (
                <>
                  <FiFileText size={16} />
                  Generate Payslips
                </>
              )}
            </button>
          </div>

          {/* SUCCESS */}
          {msg && (
            <div className="payroll-message success">
              <FiCheckCircle size={17} />
              <span>{msg}</span>
            </div>
          )}

          {/* ERROR */}
          {err && (
            <div className="payroll-message error">
              <FiAlertCircle size={17} />
              <span>{err}</span>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY */}
      <div className="payroll-summary-grid">
        <div className="payroll-summary-card">
          <div className="payroll-summary-icon">
            <FiFileText size={18} />
          </div>

          <div className="payroll-summary-content">
            <div className="payroll-summary-label">
              Total Payslips
            </div>

            <div className="payroll-summary-value">
              {list.length}
            </div>
          </div>
        </div>

        <div className="payroll-summary-card">
          <div className="payroll-summary-icon">
            <FiCalendar size={18} />
          </div>

          <div className="payroll-summary-content">
            <div className="payroll-summary-label">
              Selected Period
            </div>

            <div className="payroll-summary-value">
              {selectedPeriod}
            </div>
          </div>
        </div>

        <div className="payroll-summary-card">
          <div className="payroll-summary-icon">
            <FiCheckCircle size={18} />
          </div>

          <div className="payroll-summary-content">
            <div className="payroll-summary-label">
              Payslips for Selected Period
            </div>

            <div className="payroll-summary-value">
              {currentPeriodPayslips}
            </div>
          </div>
        </div>
      </div>

      {/* PAYSLIP LIST */}
      <div className="payroll-card">
        <div className="payroll-card-header">
          <div className="payroll-card-heading">
            <div className="payroll-card-heading-icon">
              <FiFileText size={18} />
            </div>

            <div>
              <h3>
                All Payslips
              </h3>

              <p>
                View and download generated employee payslips
              </p>
            </div>
          </div>
        </div>

        <div className="payroll-table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Net Pay</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">
                    <div className="payroll-loading">
                      <div className="payroll-loading-spinner" />

                      Loading payslips...
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="payroll-empty">
                      <div className="payroll-empty-icon">
                        <FiFileText size={23} />
                      </div>

                      <div className="payroll-empty-title">
                        No payslips generated yet
                      </div>

                      <div className="payroll-empty-text">
                        Generate payslips using the form above.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((p) => (
                  <tr key={p.id}>
                    {/* EMPLOYEE */}
                    <td data-label="Employee">
                      <div className="payroll-employee">
                        <div className="payroll-avatar">
                          <FiUsers size={16} />
                        </div>

                        <div className="payroll-employee-info">
                          <div className="payroll-employee-name">
                            {p.name || '-'}
                          </div>

                          {p.emp_code && (
                            <div className="payroll-employee-code">
                              {p.emp_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* PERIOD */}
                    <td data-label="Period">
                      <span className="payroll-period">
                        {MONTHS[
                          Number(p.month) - 1
                        ]?.slice(0, 3) || '-'}{' '}
                        {p.year}
                      </span>
                    </td>

                    {/* NET PAY */}
                    <td data-label="Net Pay">
                      <span className="payroll-net-pay">
                        {formatMoney(p.net_pay)}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td data-label="Actions">
                      <button
                        type="button"
                        className="payroll-download-btn"
                        onClick={() =>
                          handleDownload(p.id)
                        }
                        disabled={
                          downloadingId === p.id
                        }
                        title="Download payslip PDF"
                      >
                        {downloadingId === p.id ? (
                          <>
                            <FiRefreshCw
                              size={14}
                              className="payroll-spin"
                            />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <FiDownload size={14} />
                            PDF
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}