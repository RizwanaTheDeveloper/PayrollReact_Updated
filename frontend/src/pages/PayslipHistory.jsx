import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { formatINR } from "../utils/format";
import { useToast } from "../context/ToastContext";

export default function PayslipHistory() {
  const { employeeCode } = useParams();
  const { notify } = useToast();

  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .getPayslipHistory(employeeCode)
      .then(setD)
      .catch((e) => {
        setErr(e.message);
        notify(e.message, "error");
      });
  }, [employeeCode, notify]);

  if (err) {
    return <div className="error box">{err}</div>;
  }

  if (!d) {
    return <p>Loading history...</p>;
  }

  return (
    <section className="card">
      <div className="page-head">
        <div>
          <small>Payslip History</small>

          <h1>{d.employee.FullName}</h1>

          <p>
            Select a payroll period to preview the complete payslip.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pay Period</th>
              <th>TDS</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {d.periods.map((p) => (
              <tr key={`${p.year}-${p.month}`}>
                <td>
                  <strong>{p.label}</strong>
                </td>

                <td>
                  {p.monthly_tds == null
                    ? "—"
                    : formatINR(p.monthly_tds)}
                </td>

                <td>
                  {p.has_snapshot ? (
                    <Link
                      className="history-preview-btn"
                      to={`/payroll/${employeeCode}?month=${p.month}&year=${p.year}`}
                    >
                      <i className="fa-solid fa-eye" />
                      Preview Payslip
                    </Link>
                  ) : (
                    <span className="muted-action">
                      Not available
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

