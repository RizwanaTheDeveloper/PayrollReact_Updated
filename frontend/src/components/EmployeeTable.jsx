import { Link } from "react-router-dom";
import { formatDate, formatINR } from "../utils/format";

export default function EmployeeTable({ employees, onDelete }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm pb-10">
      {/* Responsive table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Code
              </th>

              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Employee
              </th>

              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Department
              </th>

              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Designation
              </th>

              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Joining
              </th>

              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Annual CTC
              </th> 

              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                      <i className="fa-solid fa-users text-lg" />
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      No employees found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Employees will appear here once they are added.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr
                  key={e.EmployeeCode}
                  className="group transition-colors hover:bg-slate-50/80"
                >
                  {/* Code */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                      {e.EmployeeCode}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {e.FullName?.[0]?.toUpperCase() || "?"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {e.FullName}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {e.Department || <span className="text-slate-400">—</span>}
                  </td>

                  {/* Designation */}
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {e.Designation || <span className="text-slate-400">—</span>}
                  </td>

                  {/* Joining */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatDate(e.JoiningDate)}
                  </td>

                  {/* CTC */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="text-sm font-semibold text-slate-800">
                      {formatINR(e.CTC)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      {/* Payslip */}
                      <Link
                        title="Generate Payslip"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        to={`/payroll/${e.EmployeeCode}`}
                      >
                        <i className="fa-solid fa-file-invoice-dollar" />
                        Payslip
                      </Link>

                      {/* History */}
                      <Link
                        title="View Payslip History"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        to={`/payslips/${e.EmployeeCode}`}
                      >
                        <i className="fa-solid fa-clock-rotate-left" />
                        History
                      </Link>

                      {/* Edit */}
                      <Link
                        title="Edit Employee"
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        to={`/employees/${e.EmployeeCode}/edit`}
                      >
                        <i className="fa-solid fa-pen-to-square" />
                      </Link>

                      {/* Delete */}
                      <button
                        type="button"
                        title="Delete Employee"
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
                        onClick={() => onDelete(e)}
                      >
                        <i className="fa-solid fa-trash-can" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile scroll hint */}
      {employees.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-2.5 text-center text-[11px] text-slate-400 sm:hidden">
          <i className="fa-solid fa-arrows-left-right mr-1" />
          Swipe horizontally to view all columns
        </div>
      )}
    </div>
  );
}
