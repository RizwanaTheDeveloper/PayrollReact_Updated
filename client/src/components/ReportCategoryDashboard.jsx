import { FiArrowRight } from 'react-icons/fi';
import './ReportCategoryDashboard.css';

export default function ReportCategoryDashboard({ categories, onOpen }) {
  return (
    <section className="report-category-dashboard" aria-label="Report categories">
      <div className="report-dashboard-heading">
        <h2>Report categories</h2>
        <p>Click a category to open its reports.</p>
      </div>
      <div className="report-dashboard-grid">
        {categories.map(({ id, label, Icon, description, summary }) => (
          <button key={id} type="button" className="report-dashboard-card" onClick={() => onOpen(id)}>
            <span className="report-dashboard-icon"><Icon aria-hidden="true" /></span>
            <strong>{label}</strong>
            <span className="report-dashboard-description">{description}</span>
            <span className="report-dashboard-footer"><span>{summary}</span><FiArrowRight aria-hidden="true" /></span>
          </button>
        ))}
      </div>
    </section>
  );
}
