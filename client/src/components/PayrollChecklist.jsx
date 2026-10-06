import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../api';

export default function PayrollChecklist({ month, year, revision }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setData(null);
    api.get('/payslips/checklist', { params: { month, year }, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setData(data); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.response?.data?.message || 'Unable to load the payroll checklist.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month, year, revision]);
  const counts = data?.summary;
  return <section className="payroll-checklist" aria-labelledby="payroll-checklist-heading">
    <div className="payroll-checklist-heading"><div><h2 id="payroll-checklist-heading">Monthly payroll checklist</h2><p>Review these items before preparing and finalizing payroll.</p></div><Link to={`/admin/reports/employees?period=${year}-${String(month).padStart(2, '0')}`}>Employee reports</Link></div>
    {loading ? <p role="status">Checking this month...</p> : error ? <p role="alert">{error}</p> : <>
      <dl className="payroll-checklist-counts">{[
        ['missing_attendance', 'Attendance gaps'], ['missing_punches', 'Punches to check'], ['pending_leaves', 'Pending leave'],
        ['missing_salary', 'Missing salary'], ['not_generated', 'Payslips to prepare'], ['finalized', 'Finalized'], ['paid', 'Paid'],
      ].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{counts[key]}</dd></div>)}</dl>
      <p className="payroll-policy-note">{data.note}</p>
      <details><summary>Review {counts.eligible} eligible employees</summary><div className="payroll-checklist-table-wrap"><table><thead><tr><th>Employee</th><th>Items to review</th><th>Payroll</th><th>Payment</th></tr></thead><tbody>{data.employees.map((employee) => {
        const items = [employee.missing_salary && 'Missing salary', employee.pending_leaves > 0 && `${employee.pending_leaves} pending leave requests`, employee.missing_attendance > 0 && `${employee.missing_attendance} attendance gaps`, employee.missing_punches > 0 && `${employee.missing_punches} punches to check`].filter(Boolean);
        return <tr key={employee.employee_id}><td><Link to={`/admin/reports/employees/${employee.employee_id}?period=${data.period}`}>{employee.name}</Link><small>{employee.emp_code}</small></td><td><span className="payroll-checklist-item">{items.length ? <FiAlertCircle aria-hidden="true" /> : <FiCheckCircle aria-hidden="true" />}{items.join(' · ') || 'No outstanding checklist items'}</span></td><td className="payroll-status-label">{employee.payroll_status.replaceAll('_', ' ')}</td><td className="payroll-status-label">{employee.payment_status}</td></tr>;
      })}</tbody></table></div></details>
    </>}
  </section>;
}
