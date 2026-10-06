import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { FiGrid, FiDollarSign, FiClock, FiCalendar, FiUsers, FiCreditCard, FiFileText, FiTrendingUp, FiShield } from 'react-icons/fi';
import { reportCategories } from '../utils/reportData';
import './ReportsNavigation.css';

const icons = {
  payroll: FiDollarSign, attendance: FiClock, leave: FiCalendar,
  deductions: FiDollarSign, employees: FiUsers, payments: FiCreditCard,
  payslips: FiFileText, loans: FiCreditCard, analytics: FiTrendingUp, audit: FiShield,
};

export default function ReportsNavigation() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const isEmployeeReport = pathname.startsWith('/admin/reports/employees');
  const category = params.get('category');
  const activeCategory = isEmployeeReport ? 'employees' : category;

  function destination(id) {
    const next = new URLSearchParams();
    if (params.get('period')) next.set('period', params.get('period'));
    if (id === 'employees') return `/admin/reports/employees${next.size ? `?${next}` : ''}`;
    if (id) next.set('category', id);
    return `/admin/reports${next.size ? `?${next}` : ''}`;
  }

  return (
    <aside className="reports-navigation" aria-label="Report categories">
      <h2>Reports</h2>
      <p>Browse by category</p>
      <nav aria-label="Reports menu">
        <Link to={destination()} className={`reports-navigation-link ${!isEmployeeReport && !reportCategories.some(([id]) => id === category) ? 'is-active' : ''}`} aria-current={!isEmployeeReport && !reportCategories.some(([id]) => id === category) ? 'page' : undefined}>
          <FiGrid aria-hidden="true" /><span>All categories</span>
        </Link>
        {reportCategories.map(([id, label]) => {
          const Icon = icons[id];
          const active = activeCategory === id;
          return <Link key={id} to={destination(id)} className={`reports-navigation-link ${active ? 'is-active' : ''}`} aria-current={active ? 'page' : undefined}><Icon aria-hidden="true" /><span>{label}</span></Link>;
        })}
      </nav>
    </aside>
  );
}
