import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import EmployeeTable from "../components/EmployeeTable";
import EmployeeForm from "../components/EmployeeForm";
import Modal from "../components/Modal";
import { formatINR } from "../utils/format";
export default function Dashboard({ user }) {
  const [emps, setEmps] = useState([]),
    [loading, setLoading] = useState(true),
    [open, setOpen] = useState(false),
    { notify } = useToast(),
    nav = useNavigate();
  const load = () =>
    api
      .getEmployees()
      .then((d) => setEmps(d.employees))
      .catch((e) => notify(e.message, "error"))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  if (loading) return <p>Loading…</p>;
  if (user.role !== "admin") {
    const e = emps[0];
    return (
      <section className="card narrow">
        <h1>{e?.FullName || "No employee record linked"}</h1>
        {e && (
          <>
            <p>
              {e.EmployeeCode} · {e.Department || "—"} · {e.Designation || "—"}
            </p>
            <div className="actions">
              <button
                className="btn primary"
                onClick={() => nav(`/payroll/${e.EmployeeCode}`)}
              >
                View Payslip
              </button>
              <a className="btn" href={`/download-payslip/${e.EmployeeCode}`}>
                Download
              </a>
            </div>
          </>
        )}
      </section>
    );
  }
  const total = emps.reduce((s, e) => s + Number(e.CTC || 0), 0);
  const del = async (e) => {
    if (!confirm(`Delete ${e.FullName}?`)) return;
    try {
      await api.deleteEmployee(e.EmployeeCode);
      setEmps((x) => x.filter((a) => a.EmployeeCode !== e.EmployeeCode));
      notify("Employee deleted.");
    } catch (x) {
      notify(x.message, "error");
    }
  };
  return (
    <>
      <section className="page-head">
        <div>
          <small>5Gen Educon Private Limited</small>
          <h1>Payroll Dashboard</h1>
          <p>Manage your team and generate payslips.</p>
        </div>
        <button className="btn primary" onClick={() => setOpen(true)}>
          + Add Employee
        </button>
      </section>
      <section className="stats">
        <div>
          <b>{emps.length}</b>
          <span>Active Employees</span>
        </div>
        <div>
          <b>{formatINR(total)}</b>
          <span>Total Annual CTC</span>
        </div>
        <div>
          <b>Ready</b>
          <span>System Status</span>
        </div>
      </section>
      <section className="card">
        <div className="card-head">
          <h2>Employees</h2>
          <span>{emps.length} records</span>
        </div>
        {emps.length ? (
          <EmployeeTable employees={emps} onDelete={del} />
        ) : (
          <p>No employees yet.</p>
        )}
      </section>
      <Modal open={open} title="Add Employee" onClose={() => setOpen(false)}>
        <EmployeeForm
          onSaved={() => {
            setOpen(false);
            load();
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
