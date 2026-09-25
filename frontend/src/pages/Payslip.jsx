import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { formatINR, formatDate } from "../utils/format";

export default function Payslip() {
  const { employeeCode } = useParams(),
    [sp] = useSearchParams(),
    [d, setD] = useState(null),
    [err, setErr] = useState("");

  const m = sp.get("month"),
    y = sp.get("year");

  useEffect(() => {
    api
      .getPayslip(employeeCode, m, y)
      .then(setD)
      .catch((e) => setErr(e.message));
  }, [employeeCode, m, y]);

  if (err) return <div className="error box">{err}</div>;
  if (!d) return <p>Loading payslip…</p>;

  const { employee: e, payroll: p, tax: t } = d;

  const workingDays =
    p.working_days ?? e.WorkingDays ?? 0;

  const daysInMonth =
    p.days_in_month ??
    new Date(
      Number(y || new Date().getFullYear()),
      Number(m || new Date().getMonth() + 1),
      0
    ).getDate();

  return (
    <section className="payslip">
      <div className="page-head">
        <div>
          <small>{d.company_name}</small>
          <h1>Payslip</h1>
          <p>{d.period_label}</p>
        </div>
      </div>

      <div className="panel">
        <h3>Employee Details</h3>

        <div className="detail">
          <span>Name</span>
          <b>{e.FullName}</b>
        </div>

        <div className="detail">
          <span>Code</span>
          <b>{e.EmployeeCode}</b>
        </div>

        <div className="detail">
          <span>Designation</span>
          <b>{e.Designation || "—"}</b>
        </div>

        <div className="detail">
          <span>PAN</span>
          <b>{e.PAN || "—"}</b>
        </div>

        <div className="detail">
          <span>Joining Date</span>
          <b>{formatDate(e.JoiningDate)}</b>
        </div>

        <div className="detail">
          <span>Regime</span>
          <b>{e.RegimeOpted}</b>
        </div>

        <div className="detail">
          <span>Working Days</span>
          <b>
            {workingDays} / {daysInMonth}
          </b>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Earnings</h3>

          {[
            ["Basic", p.basic],
            ["HRA", p.hra],
            ["Special Allowance", p.special_allowance],
            ["LTA", p.lta],
            ["Bonus", p.bonus],
            ["Gross Earnings", p.gross_earnings],
          ].map(([a, b]) => (
            <div className="detail" key={a}>
              <span>{a}</span>
              <b>{formatINR(b)}</b>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Deductions</h3>

          {[
            ["Professional Tax", p.professional_tax],
            ["EPF", p.epf],
            ["TDS", p.tds],
            ["Total Deductions", p.total_deductions],
          ].map(([a, b]) => (
            <div className="detail" key={a}>
              <span>{a}</span>
              <b>{formatINR(b)}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="net">
        Net Salary <strong>{formatINR(p.net_salary)}</strong>
      </div>

      <div className="panel">
        <h3>Tax</h3>

        <div className="detail">
          <span>Annual Taxable Salary</span>
          <b>{formatINR(t.annual_taxable_salary)}</b>
        </div>

        <div className="detail">
          <span>Standard Deduction</span>
          <b>{formatINR(t.standard_deduction)}</b>
        </div>

        <div className="detail">
          <span>Net Taxable Income</span>
          <b>{formatINR(t.net_taxable_income)}</b>
        </div>

        <div className="detail">
          <span>Net Tax</span>
          <b>{formatINR(t.net_tax)}</b>
        </div>
      </div>

      <div className="actions no-print">
        <Link className="btn" to="/">
          Back
        </Link>

        <button
          className="btn primary"
          onClick={() => window.print()}
        >
          Print
        </button>

        <a
          className="btn primary"
          href={`/download-payslip/${employeeCode}${
            m && y ? `?month=${m}&year=${y}` : ""
          }`}
        >
          Download PDF
        </a>
      </div>
    </section>
  );
}