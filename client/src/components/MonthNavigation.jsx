import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export function shiftMonth(period, offset) {
  const [year, month] = period.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + offset, 1));
  return next.toISOString().slice(0, 7);
}

export default function MonthNavigation({ period, onChange }) {
  return <div className="payroll-month-navigation" role="group" aria-label="Change reporting month">
    <button type="button" className="reports-secondary" disabled={period <= '2000-01'} onClick={() => onChange(shiftMonth(period, -1))}><FiChevronLeft aria-hidden="true" />Previous month</button>
    <button type="button" className="reports-secondary" disabled={period >= '2100-12'} onClick={() => onChange(shiftMonth(period, 1))}>Next month<FiChevronRight aria-hidden="true" /></button>
  </div>;
}
