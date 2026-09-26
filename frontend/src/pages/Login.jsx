import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PasswordInput from "../components/PasswordInput";
import { COMPANY_NAME } from "../utils/constants";

export default function Login() {
  const { user, login } = useAuth();
  const { notify } = useToast();

  const nav = useNavigate();
  const loc = useLocation();

  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setErr("");

    try {
      const x = await login(u.trim(), p);

      notify(`Welcome back, ${x.username}.`);

      nav(loc.state?.from || "/");
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* =====================================================
            LEFT - COMPANY PANEL
        ====================================================== */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-1/2 xl:w-[55%]">
          
          {/* Background decoration */}
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/30">
                  <i className="fa-solid fa-wallet text-xl" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    PayRoll
                  </h1>

                  <p className="mt-0.5 text-xs font-medium uppercase tracking-widest text-slate-400">
                    {COMPANY_NAME}
                  </p>
                </div>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Employee Payroll Management
              </div>

              <h2 className="text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Simple, secure and
                <span className="block text-blue-400">
                  smarter payroll.
                </span>
              </h2>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
                Manage payroll, employee information, payslips and salary
                details from one secure and professional platform.
              </p>

              {/* Features */}
              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-blue-400">
                    <i className="fa-solid fa-shield-halved" />
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    Secure Access
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-blue-400">
                    <i className="fa-solid fa-file-invoice-dollar" />
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    Digital Payslips
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-blue-400">
                    <i className="fa-solid fa-users" />
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    Employee Management
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-blue-400">
                    <i className="fa-solid fa-chart-line" />
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    Payroll Insights
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </section>

        {/* =====================================================
            RIGHT - LOGIN
        ====================================================== */}
        <section className="flex min-h-screen flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:min-h-0 lg:px-12 xl:px-20">

          <div className="w-full max-w-md">

            {/* Mobile brand */}
            <div className="mb-10 flex flex-col items-center text-center lg:hidden">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <i className="fa-solid fa-wallet text-2xl" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                PayRoll
              </h1>

              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {COMPANY_NAME}
              </p>
            </div>

            {/* Login card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

              {/* Header */}
              <div className="mb-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <i className="fa-solid fa-right-to-bracket" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Sign in
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your credentials to access your payroll account.
                </p>
              </div>

              {/* Error */}
              {err && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <i className="fa-solid fa-circle-exclamation mt-0.5" />

                  <span>{err}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={submit} className="space-y-5">

                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Username
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <i className="fa-solid fa-user text-sm" />
                    </span>

                    <input
                      id="username"
                      type="text"
                      value={u}
                      onChange={(e) => setU(e.target.value)}
                      autoFocus
                      autoComplete="username"
                      required
                      disabled={busy}
                      placeholder="Enter your username"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <PasswordInput
                    id="password"
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    required
                    disabled={busy}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all duration-200 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-right-to-bracket" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <i className="fa-solid fa-lock" />
                <span>Your account is securely protected.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
