import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../services/api";
import { formatINR, formatDate } from "../utils/format";

export default function Payslip() {
  const { employeeCode } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  const m = sp.get("month");
  const y = sp.get("year");

  // PDF download must always target the Flask backend.
  // The frontend Render service is not the PDF endpoint.
  const API_BASE =
    "https://payrollreact-updated.onrender.com";

  useEffect(() => {
    setD(null);
    setErr("");

    api
      .getPayslip(employeeCode, m, y)
      .then(setD)
      .catch((e) => setErr(e.message));
  }, [employeeCode, m, y]);

  if (err) {
    return (
      <section className="payslip-page">
        <div className="payslip-toolbar no-print">
          <button
            type="button"
            className="btn"
            onClick={() => navigate(-1)}
          >
            <i className="fa-solid fa-arrow-left" />
            Back
          </button>
        </div>

        <div className="error box">
          {err}
        </div>
      </section>
    );
  }

  if (!d) {
    return (
      <section className="payslip-page">
        <div className="payslip-toolbar no-print">
          <button
            type="button"
            className="btn"
            onClick={() => navigate(-1)}
          >
            <i className="fa-solid fa-arrow-left" />
            Back
          </button>
        </div>

        <div className="card">
          <p>Loading payslip...</p>
        </div>
      </section>
    );
  }

  const {
    employee: e,
    payroll: p,
    tax: t,
  } = d;

  const workingDays =
    p.working_days ?? e.WorkingDays ?? 0;

  const daysInMonth =
    p.days_in_month ??
    new Date(
      Number(y || new Date().getFullYear()),
      Number(m || new Date().getMonth() + 1),
      0
    ).getDate();

  const periodLabel =
    d.period_label ||
    new Date(
      Number(y || new Date().getFullYear()),
      Number(m || new Date().getMonth()),
      1
    ).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });

  const downloadUrl =
    `${API_BASE}/download-payslip/${employeeCode}` +
    (m && y ? `?month=${m}&year=${y}` : "");

  return (
    <section className="payslip-page">

      {/* TOOLBAR */}
      <div className="payslip-toolbar no-print">

        <button
          type="button"
          className="btn"
          onClick={() => navigate(-1)}
        >
          <i className="fa-solid fa-arrow-left" />
          Back
        </button>

        <div className="actions">

          <button
            type="button"
            className="btn"
            onClick={() => window.print()}
          >
            <i className="fa-solid fa-print" />
            Print
          </button>

          <a
            className="btn primary"
            href={downloadUrl}
          >
            <i className="fa-solid fa-file-arrow-down" />
            Download PDF
          </a>

        </div>
      </div>

      {/* PAYSLIP */}
      <article className="payslip">

        {/* HEADER */}
        <header className="payslip-header">

          <div className="company-block">

            <div className="company-logo">
              <i className="fa-solid fa-building" />
            </div>

            <div>
              <div className="company-name">
                {d.company_name}
              </div>

              <div className="company-subtitle">
                Employee Payroll Statement
              </div>
            </div>

          </div>

          <div className="payslip-title">

            <div className="payslip-label">
              SALARY STATEMENT
            </div>

            <h1>Payslip</h1>

            <div className="period">
              {periodLabel}
            </div>

          </div>

        </header>

        {/* EMPLOYEE INFORMATION */}
        <section className="payslip-section">

          <div className="section-heading">

            <div className="section-icon">
              <i className="fa-solid fa-user" />
            </div>

            <div>
              <h2>Employee Information</h2>
              <span>
                Employment and payroll details
              </span>
            </div>

          </div>

          <div className="employee-grid">

            <div className="info-item">
              <span>Employee Name</span>
              <strong>{e.FullName}</strong>
            </div>

            <div className="info-item">
              <span>Employee Code</span>
              <strong>{e.EmployeeCode}</strong>
            </div>

            <div className="info-item">
              <span>Designation</span>
              <strong>{e.Designation || "—"}</strong>
            </div>

            <div className="info-item">
              <span>Department</span>
              <strong>{e.Department || "—"}</strong>
            </div>

            <div className="info-item">
              <span>PAN</span>
              <strong>{e.PAN || "—"}</strong>
            </div>

            <div className="info-item">
              <span>Joining Date</span>
              <strong>{formatDate(e.JoiningDate)}</strong>
            </div>

            <div className="info-item">
              <span>Tax Regime</span>
              <strong>{e.RegimeOpted || "New"}</strong>
            </div>

            <div className="info-item">
              <span>Working Days</span>
              <strong>
                {workingDays} / {daysInMonth}
              </strong>
            </div>

          </div>

        </section>

        {/* EARNINGS + DEDUCTIONS */}
        <div className="salary-columns">

          {/* EARNINGS */}
          <section className="salary-card">

            <div className="salary-card-header earnings-header">

              <div className="salary-card-icon">
                <i className="fa-solid fa-arrow-trend-up" />
              </div>

              <div>
                <h2>Earnings</h2>
                <span>Salary components</span>
              </div>

            </div>

            <div className="salary-lines">

              {[
                ["Basic", p.basic],
                ["HRA", p.hra],
                ["Special Allowance", p.special_allowance],
                ["LTA", p.lta],
                ["Bonus", p.bonus],
              ].map(([label, value]) => (
                <div
                  className="salary-line"
                  key={label}
                >
                  <span>{label}</span>
                  <strong>{formatINR(value)}</strong>
                </div>
              ))}

              <div className="salary-line total-line">
                <span>Gross Earnings</span>
                <strong>
                  {formatINR(p.gross_earnings)}
                </strong>
              </div>

            </div>

          </section>

          {/* DEDUCTIONS */}
          <section className="salary-card">

            <div className="salary-card-header deductions-header">

              <div className="salary-card-icon">
                <i className="fa-solid fa-arrow-trend-down" />
              </div>

              <div>
                <h2>Deductions</h2>
                <span>
                  Statutory and tax deductions
                </span>
              </div>

            </div>

            <div className="salary-lines">

              {[
                ["Professional Tax", p.professional_tax],
                ["EPF", p.epf],
                ["TDS", p.tds],
              ].map(([label, value]) => (
                <div
                  className="salary-line"
                  key={label}
                >
                  <span>{label}</span>
                  <strong>{formatINR(value)}</strong>
                </div>
              ))}

              <div className="salary-line total-line">
                <span>Total Deductions</span>
                <strong>
                  {formatINR(p.total_deductions)}
                </strong>
              </div>

            </div>

          </section>

        </div>

        {/* NET SALARY */}
        <section className="net-salary-card">

          <div>
            <span>Net Salary Payable</span>

            <small>
              Amount credited for {periodLabel}
            </small>
          </div>

          <strong>
            {formatINR(p.net_salary)}
          </strong>

        </section>

        {/* TAX SUMMARY */}
        <section className="payslip-section tax-section">

          <div className="section-heading">

            <div className="section-icon">
              <i className="fa-solid fa-file-invoice-dollar" />
            </div>

            <div>
              <h2>Tax Summary</h2>
              <span>
                Annual tax calculation summary
              </span>
            </div>

          </div>

          <div className="tax-grid">

            <div className="tax-item">
              <span>Annual Taxable Salary</span>
              <strong>
                {formatINR(t.annual_taxable_salary)}
              </strong>
            </div>

            <div className="tax-item">
              <span>Standard Deduction</span>
              <strong>
                {formatINR(t.standard_deduction)}
              </strong>
            </div>

            <div className="tax-item">
              <span>Net Taxable Income</span>
              <strong>
                {formatINR(t.net_taxable_income)}
              </strong>
            </div>

            <div className="tax-item">
              <span>Net Tax</span>
              <strong>
                {formatINR(t.net_tax)}
              </strong>
            </div>

          </div>

        </section>

        {/* FOOTER */}
        <footer className="payslip-footer">

          <div>
            <strong>Generated on</strong>
            <span>
              {d.generated_at || "—"}
            </span>
          </div>

          <div className="confidential">
            <i className="fa-solid fa-lock" />
            Confidential Payroll Document
          </div>

        </footer>

      </article>

    </section>
  );
}