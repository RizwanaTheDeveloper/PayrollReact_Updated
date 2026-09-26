
import { useEffect, useState } from "react";
import { Link} from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import EmployeeTable from "../components/EmployeeTable";
import EmployeeForm from "../components/EmployeeForm";
import Modal from "../components/Modal";
import { formatINR } from "../utils/format";

export default function Dashboard({ user }) {
  const [emps, setEmps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const { notify } = useToast();

  const load = () =>
    api
      .getEmployees()
      .then((d) => setEmps(d.employees))
      .catch((e) => notify(e.message, "error"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  /* ============================================================
     LOADING
  ============================================================ */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <i className="fa-solid fa-spinner animate-spin text-lg" />
          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     EMPLOYEE DASHBOARD
  ============================================================ */
  if (user.role !== "admin") {
    const e = emps[0];

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Employee Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Access your payroll information and payslips.
          </p>
        </div>

        {!e ? (
          /* Empty employee state */
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <i className="fa-solid fa-user-slash text-2xl" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-slate-800">
                No employee record linked
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your account is not currently linked to an employee payroll
                record. Please contact your administrator.
              </p>
            </div>
          </section>
        ) : (
          <>
            {/* Employee profile card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              {/* Blue header */}
              <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-7 sm:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg font-bold text-white ring-4 ring-white/10">
                      {e.FullName?.[0]?.toUpperCase() || "?"}
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-blue-100">
                        Employee
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                        {e.FullName}
                      </h2>

                      <p className="mt-1 text-sm text-blue-100">
                        {e.EmployeeCode}
                      </p>
                    </div>
                  </div>

                  <div className="self-start rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                    <i className="fa-solid fa-circle-check mr-1.5 text-[10px]" />
                    Active
                  </div>
                </div>
              </div>

              {/* Employee details */}
              <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-3">
                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Department
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {e.Department || "—"}
                  </p>
                </div>

                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Designation
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {e.Designation || "—"}
                  </p>
                </div>

                <div className="bg-white px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Annual CTC
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {formatINR(e.CTC)}
                  </p>
                </div>
              </div>

             {/* Actions */}
{/* Actions */}
<div className="flex flex-col gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6">

  {/* Payslip - same as Admin */}
  <Link
    to={`/payroll/${e.EmployeeCode}`}
    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200"
  >
    <i className="fa-solid fa-file-invoice-dollar" />
    Payslip
  </Link>

  {/* History */}
  <Link
    to={`/payslips/${e.EmployeeCode}`}
    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
  >
    <i className="fa-solid fa-clock-rotate-left" />
    History
  </Link>

</div>
            </section>
          </>
        )}
      </main>
    );
  }

  /* ============================================================
     ADMIN DASHBOARD
  ============================================================ */

  const total = emps.reduce(
    (s, e) => s + Number(e.CTC || 0),
    0
  );

  const del = async (e) => {
    if (!confirm(`Delete ${e.FullName}?`)) return;

    try {
      await api.deleteEmployee(e.EmployeeCode);

      setEmps((x) =>
        x.filter((a) => a.EmployeeCode !== e.EmployeeCode)
      );

      notify("Employee deleted.");
    } catch (x) {
      notify(x.message, "error");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

      {/* ========================================================
          DASHBOARD HEADER
      ======================================================== */}
      <section className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            5Gen Educon Private Limited
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Payroll Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage employees, payroll information and payslips from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.99] sm:w-auto"
        >
          <i className="fa-solid fa-user-plus" />
          Add Employee
        </button>
      </section>

      {/* ========================================================
          STAT CARDS
      ======================================================== */}
      <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* Employees */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Employees
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {emps.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <i className="fa-solid fa-users" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <i className="fa-solid fa-circle-check" />
            Employee records available
          </div>
        </div>

        {/* CTC */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                Total Annual CTC
              </p>

              <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {formatINR(total)}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <i className="fa-solid fa-indian-rupee-sign" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <i className="fa-solid fa-chart-line" />
            Combined employee CTC
          </div>
        </div>

        {/* Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                System Status
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-600">
                Ready
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <i className="fa-solid fa-circle-check" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Payroll system operational
          </div>
        </div>
      </section>

      {/* ========================================================
          EMPLOYEE SECTION
      ======================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Section heading */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <i className="fa-solid fa-users" />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Employees
              </h2>
            </div>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {emps.length}{" "}
            {emps.length === 1 ? "record" : "records"}
          </span>
        </div>

        {/* Employee table */}
        {emps.length ? (
          <EmployeeTable employees={emps} onDelete={del} />
        ) : (
          <div className="px-5 py-14 sm:px-6">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <i className="fa-solid fa-users-slash text-2xl" />
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-800">
                No employees yet
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start building your payroll records by adding your first
                employee.
              </p>

              <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <i className="fa-solid fa-user-plus" />
                Add Employee
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================
          ADD EMPLOYEE MODAL
      ======================================================== */}
      <Modal
        open={open}
        title="Add Employee"
        onClose={() => setOpen(false)}
      >
        <EmployeeForm
          onSaved={() => {
            setOpen(false);
            load();
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </main>
  );
}
