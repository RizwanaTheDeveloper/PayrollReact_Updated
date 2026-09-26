import { useEffect, useState } from "react";
import { api } from "../services/api";
import { validateEmployee } from "../utils/validation";
import { useToast } from "../context/ToastContext";

const blank = {
  employee_code: "",
  full_name: "",
  department: "",
  designation: "",
  joining_date: "",
  ctc: "",
  working_days: "",
  regime_opted: "New",
  pan: "",
  pf_uan: "",
  account_number: "",
  ifsc_code: "",
  login_username: "",
  login_password: "",
};

export default function EmployeeForm({ employeeCode, onSaved, onCancel }) {
  const [f, setF] = useState(blank);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { notify } = useToast();

  useEffect(() => {
    if (employeeCode) {
      api.getEmployee(employeeCode).then((d) =>
        setF({
          ...blank,
          employee_code: d.employee.EmployeeCode || "",
          full_name: d.employee.FullName || "",
          department: d.employee.Department || "",
          designation: d.employee.Designation || "",
          joining_date: d.employee.JoiningDate || "",
          ctc: d.employee.CTC,
          working_days: d.employee.WorkingDays ?? "",
          regime_opted: d.employee.RegimeOpted || "New",
          pan: d.employee.PAN || "",
          pf_uan: d.employee.PFUAN || "",
          account_number: d.employee.AccountNumber || "",
          ifsc_code: d.employee.IFSCCode || "",
          login_username: d.login_username || "",
        }),
      );
    }
  }, [employeeCode]);

  const change = (e) => {
    setF((x) => ({
      ...x,
      [e.target.name]: ["pan", "ifsc_code"].includes(e.target.name)
        ? e.target.value.toUpperCase()
        : e.target.value,
    }));

    // Remove field error when user starts correcting it
    if (errors[e.target.name]) {
      setErrors((prev) => ({
        ...prev,
        [e.target.name]: "",
      }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    const er = validateEmployee(f);
    setErrors(er);

    if (Object.keys(er).length) return;

    setLoading(true);

    try {
      const d = employeeCode
        ? await api.updateEmployee(employeeCode, f)
        : await api.addEmployee(f);

      if (d.warning) {
        notify(d.warning, "error");
      } else {
        notify(
          employeeCode
            ? "Employee updated successfully."
            : "Employee added successfully.",
        );
      }

      onSaved(d);
    } catch (x) {
      notify(x.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) => `
    h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-slate-800
    outline-none transition-all duration-200
    placeholder:text-slate-400
    hover:border-slate-400
    focus:border-blue-500
    focus:ring-4 focus:ring-blue-100
    disabled:cursor-not-allowed disabled:bg-slate-50
    ${
      errors[name]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300"
    }
  `;

  const field = (name, label, type = "text", placeholder = "") => (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={f[name] ?? ""}
        onChange={change}
        disabled={loading || (name === "employee_code" && !!employeeCode)}
        placeholder={placeholder}
        className={inputClass(name)}
      />

      {errors[name] && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <i className="fa-solid fa-circle-exclamation" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* =====================================================
          PERSONAL / JOB INFORMATION
      ====================================================== */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <i className="fa-solid fa-user" />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Employee Information
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Basic employee and employment details
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          {field("employee_code", "Employee Code", "text", "e.g. EMP001")}
          {field("full_name", "Full Name", "text", "Enter employee full name")}
          {field("department", "Department", "text", "e.g. Engineering")}
          {field(
            "designation",
            "Designation",
            "text",
            "e.g. Software Engineer",
          )}

          {field("joining_date", "Joining Date", "date")}
        </div>
      </section>

      {/* =====================================================
          SALARY INFORMATION
      ====================================================== */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <i className="fa-solid fa-indian-rupee-sign" />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Payroll Information
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Salary, working days and tax regime
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
          {field("ctc", "Annual CTC", "number", "Enter annual CTC")}

          {field("working_days", "Working Days", "number", "Days worked")}

          <div>
            <label
              htmlFor="regime_opted"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Tax Regime
            </label>

            <select
              id="regime_opted"
              name="regime_opted"
              value={f.regime_opted}
              onChange={change}
              disabled={loading}
              className={inputClass("regime_opted")}
            >
              <option value="New">New Regime</option>
              <option value="Old">Old Regime</option>
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          BANK / STATUTORY INFORMATION
      ====================================================== */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <i className="fa-solid fa-building-columns" />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Banking & Statutory Details
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                PAN, PF and bank account information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          {field("pan", "PAN", "text", "e.g. ABCDE1234F")}

          {field("pf_uan", "PF UAN", "text", "Enter PF UAN")}

          {field(
            "account_number",
            "Account Number",
            "text",
            "Enter bank account number",
          )}

          {field("ifsc_code", "IFSC Code", "text", "e.g. SBIN0001234")}
        </div>
      </section>

      {/* =====================================================
          LOGIN INFORMATION
      ====================================================== */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <i className="fa-solid fa-lock" />
            </span>

            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Login Credentials
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Employee portal login information
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
          {field(
            "login_username",
            "Username / Email",
            "text",
            "Enter login username",
          )}

          {field(
            "login_password",
            "Password",
            "password",
            employeeCode
              ? "Leave blank to keep existing password"
              : "Enter login password",
          )}
        </div>
      </section>

      {/* =====================================================
          ACTIONS
      ====================================================== */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fa-solid fa-xmark" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-check" />
              {employeeCode ? "Save Changes" : "Save Employee"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
