import { useEffect, useMemo, useState } from 'react';
import api from '../../api';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiSave,
  FiUser,
  FiMail,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiUsers,
} from 'react-icons/fi';

const salaryKeys = [
  'basic',
  'hra',
  'special_allowance',
  'lta',
  'other_allowances',
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  emp_code: '',
  name: '',
  email: '',
  password: '',
  designation: '',
  gender: '',
  dob: '',
  pan: '',
  pf_uan: '',
  joining_date: todayStr(),
  resignation_date: '',
  ctc: '',
  tax_regime: 'old',
  basic: '',
  hra: '',
  special_allowance: '',
  lta: '',
  other_allowances: '',
  account_number: '',
  ifsc_code: '',
};

const money = (value) => {
  if (value === null || value === undefined || value === '') return '-';

  const number = Number(value);

  if (Number.isNaN(number)) return '-';

  return `₹${number.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
};

function Toast({ toast, onClose }) {
  if (!toast) return null;

  const success = toast.type === 'success';

  return (
    <div className={`employee-toast ${success ? 'success' : 'error'}`}>
      <div className="employee-toast-icon">
        {success ? <FiCheckCircle /> : <FiAlertCircle />}
      </div>

      <div className="employee-toast-message">
        {toast.message}
      </div>

      <button
        type="button"
        className="employee-toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <FiX />
      </button>
    </div>
  );
}

function SectionHeader({ icon, title, description }) {
  return (
    <div className="employee-section-header">
      <div className="employee-section-icon">
        {icon}
      </div>

      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);

  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);

      const response = await api.get('/employees');

      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);

      showToast(
        error.response?.data?.message ||
          'Failed to load employees.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return employees;
    }

    return employees.filter((employee) => {
      return [
        employee.emp_code,
        employee.name,
        employee.email,
        employee.designation,
        employee.department,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value)
        );
    });
  }, [employees, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 50);
  };

  const openEditForm = (employee) => {
    setEditingId(employee.id);

    setForm({
      emp_code: employee.emp_code || '',
      name: employee.name || '',
      email: employee.email || '',
      password: '',
      designation: employee.designation || '',
      gender: employee.gender || '',
      dob: employee.dob
        ? String(employee.dob).slice(0, 10)
        : '',
      pan: employee.pan || '',
      pf_uan: employee.pf_uan || '',
      joining_date: employee.joining_date
        ? String(employee.joining_date).slice(0, 10)
        : todayStr(),
      resignation_date: employee.resignation_date
        ? String(employee.resignation_date).slice(0, 10)
        : '',
      ctc: employee.ctc ?? '',
      tax_regime: employee.tax_regime || 'old',
      basic: employee.basic ?? '',
      hra: employee.hra ?? '',
      special_allowance: employee.special_allowance ?? '',
      lta: employee.lta ?? '',
      other_allowances: employee.other_allowances ?? '',
      account_number: employee.account_number || '',
      ifsc_code: employee.ifsc_code || '',
    });

    setErrors({});
    setShowForm(true);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }, 50);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.emp_code.trim()) {
      nextErrors.emp_code = 'Employee code is required.';
    }

    if (!form.name.trim()) {
      nextErrors.name = 'Employee name is required.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    }

    if (!editingId && !form.password.trim()) {
      nextErrors.password = 'Password is required.';
    }

    if (!form.designation.trim()) {
      nextErrors.designation = 'Designation is required.';
    }

    if (!form.gender) {
      nextErrors.gender = 'Gender is required.';
    }

    if (!form.dob) {
      nextErrors.dob = 'Date of birth is required.';
    }

    if (!form.pan.trim()) {
      nextErrors.pan = 'PAN is required.';
    }

    if (!form.pf_uan.trim()) {
      nextErrors.pf_uan = 'PF UAN is required.';
    }

    if (!form.account_number.trim()) {
      nextErrors.account_number =
        'Bank account number is required.';
    }

    if (!form.ifsc_code.trim()) {
      nextErrors.ifsc_code = 'IFSC code is required.';
    }

    if (!form.joining_date) {
      nextErrors.joining_date =
        'Joining date is required.';
    }

    if (
      form.resignation_date &&
      form.joining_date &&
      form.resignation_date < form.joining_date
    ) {
      nextErrors.resignation_date =
        'Resignation date cannot be before joining date.';
    }

    if (
      form.ctc === '' ||
      form.ctc === null ||
      Number(form.ctc) < 0
    ) {
      nextErrors.ctc = 'Enter a valid CTC.';
    }

    salaryKeys.forEach((key) => {
      if (
        form[key] !== '' &&
        form[key] !== null &&
        Number(form[key]) < 0
      ) {
        nextErrors[key] = 'Cannot be negative.';
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: '',
      }));
    }
  };

  const buildPayload = () => {
    const payload = {
      emp_code: form.emp_code.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      designation: form.designation.trim(),
      gender: form.gender,
      dob: form.dob,
      pan: form.pan.trim().toUpperCase(),
      pf_uan: form.pf_uan.trim(),
      joining_date: form.joining_date,
      resignation_date: form.resignation_date || null,
      ctc: Number(form.ctc),
      tax_regime: form.tax_regime,
      account_number: form.account_number.trim(),
      ifsc_code: form.ifsc_code.trim().toUpperCase(),
    };

    salaryKeys.forEach((key) => {
      payload[key] =
        form[key] === '' || form[key] === null
          ? 0
          : Number(form[key]);
    });

    if (form.password.trim()) {
      payload.password = form.password;
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      showToast(
        'Please correct the highlighted fields.',
        'error'
      );
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingId) {
        await api.put(
          `/employees/${editingId}`,
          payload
        );

        showToast('Employee updated successfully.');
      } else {
        await api.post('/employees', payload);

        showToast('Employee added successfully.');
      }

      await loadEmployees();

      closeForm();
    } catch (error) {
      console.error(error);

      showToast(
        error.response?.data?.message ||
          'Failed to save employee.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Delete employee "${employee.name}" (${employee.emp_code})?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/employees/${employee.id}`);

      showToast('Employee deleted successfully.');

      await loadEmployees();
    } catch (error) {
      console.error(error);

      showToast(
        error.response?.data?.message ||
          'Failed to delete employee.',
        'error'
      );
    }
  };

  const fieldClass = (fieldName) =>
    `employee-input ${
      errors[fieldName] ? 'has-error' : ''
    }`;

  return (
    <div className="employees-page">
      <style>{`
        .employees-page {
          width: 100%;
          min-width: 0;
          padding: 4px 0 30px;
        }

        .employees-page *,
        .employees-page *::before,
        .employees-page *::after {
          box-sizing: border-box;
        }

        .employees-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .employees-title-wrap {
          min-width: 0;
        }

        .employees-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          color: #0f172a;
          font-size: 26px;
          font-weight: 750;
          line-height: 1.2;
        }

        .employees-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          flex-shrink: 0;
        }

        .employees-subtitle {
          margin: 7px 0 0 52px;
          color: #64748b;
          font-size: 14px;
        }

        .employees-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 30px;
          height: 25px;
          padding: 0 9px;
          margin-left: 5px;
          border-radius: 999px;
          background: #e2e8f0;
          color: #334155;
          font-size: 12px;
          font-weight: 700;
        }

        .employee-primary-btn,
        .employee-secondary-btn {
          border: 0;
          border-radius: 10px;
          min-height: 42px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 650;
          transition: 0.18s ease;
          white-space: nowrap;
        }

        .employee-primary-btn {
          background: #2563eb;
          color: #fff;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.18);
        }

        .employee-primary-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .employee-primary-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .employee-secondary-btn {
          background: #f1f5f9;
          color: #334155;
        }

        .employee-secondary-btn:hover {
          background: #e2e8f0;
        }

        .employee-form-card,
        .employees-table-card {
          width: 100%;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.045);
        }

        .employee-form-card {
          margin-bottom: 22px;
          overflow: hidden;
        }

        .employee-form-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }

        .employee-form-title {
          margin: 0;
          font-size: 17px;
          color: #0f172a;
          font-weight: 700;
        }

        .employee-form-subtitle {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .employee-form-body {
          padding: 22px;
        }

        .employee-section {
          padding: 0 0 22px;
          margin-bottom: 22px;
          border-bottom: 1px solid #e2e8f0;
        }

        .employee-section:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: 0;
        }

        .employee-section-header {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 18px;
        }

        .employee-section-icon {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .employee-section-header h3 {
          margin: 0;
          font-size: 15px;
          color: #0f172a;
        }

        .employee-section-header p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        .employee-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .employee-field {
          min-width: 0;
        }

        .employee-field.full {
          grid-column: 1 / -1;
        }

        .employee-label {
          display: block;
          margin-bottom: 7px;
          color: #334155;
          font-size: 12px;
          font-weight: 650;
        }

        .employee-required {
          color: #dc2626;
        }

        .employee-input,
        .employee-select {
          width: 100%;
          min-height: 42px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 12px;
          outline: none;
          background: #fff;
          color: #0f172a;
          font-size: 14px;
          transition: 0.18s ease;
        }

        .employee-input:focus,
        .employee-select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        .employee-input.has-error,
        .employee-select.has-error {
          border-color: #ef4444;
          background: #fffafa;
        }

        .employee-error {
          margin-top: 5px;
          color: #dc2626;
          font-size: 11px;
        }

        .employee-help {
          margin-top: 5px;
          color: #94a3b8;
          font-size: 11px;
        }

        .employee-form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .employees-table-card {
          overflow: hidden;
        }

        .employees-table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .employees-table-title {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
        }

        .employees-table-title svg {
          color: #2563eb;
        }

        .employee-search {
          width: min(340px, 100%);
          position: relative;
        }

        .employee-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .employee-search input {
          width: 100%;
          height: 40px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 0 12px 0 37px;
          outline: none;
          color: #0f172a;
          background: #fff;
        }

        .employee-search input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.10);
        }

        .employee-table-wrapper {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        }

        .employee-table {
          width: 100%;
          min-width: 920px;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .employee-table th {
          padding: 13px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.035em;
          text-align: left;
          white-space: nowrap;
        }

        .employee-table td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-size: 13px;
          vertical-align: middle;
          overflow: hidden;
        }

        .employee-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .employee-table tbody tr:hover {
          background: #f8fafc;
        }

        /*
          Fixed widths keep the Actions column close to its header
          and prevent it from drifting to the far right.
        */
        .employee-table th:nth-child(1),
        .employee-table td:nth-child(1) {
          width: 85px;
        }

        .employee-table th:nth-child(2),
        .employee-table td:nth-child(2) {
          width: 19%;
        }

        .employee-table th:nth-child(3),
        .employee-table td:nth-child(3) {
          width: 18%;
        }

        .employee-table th:nth-child(4),
        .employee-table td:nth-child(4) {
          width: 22%;
        }

        .employee-table th:nth-child(5),
        .employee-table td:nth-child(5) {
          width: 13%;
        }

        .employee-table th:nth-child(6),
        .employee-table td:nth-child(6) {
          width: 190px;
        }

        .employee-id {
          color: #64748b;
          font-weight: 600;
        }

        .employee-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .employee-avatar {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
        }

        .employee-name-content {
          min-width: 0;
        }

        .employee-name {
          color: #0f172a;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .employee-code {
          margin-top: 2px;
          color: #94a3b8;
          font-size: 11px;
        }

        .employee-email {
          display: block;
          max-width: 100%;
          color: #475569;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .employee-designation {
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .employee-ctc {
          color: #0f172a;
          font-weight: 700;
          white-space: nowrap;
        }

        .employee-actions {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 7px;
          width: 100%;
          white-space: nowrap;
        }

        .employee-action-btn {
          min-height: 34px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 650;
          transition: 0.18s ease;
          white-space: nowrap;
        }

        .employee-edit-btn {
          color: #2563eb;
          background: #eff6ff;
          border-color: #bfdbfe;
        }

        .employee-edit-btn:hover {
          background: #dbeafe;
          border-color: #93c5fd;
        }

        .employee-delete-btn {
          color: #dc2626;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .employee-delete-btn:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }

        .employee-empty {
          padding: 50px 20px;
          text-align: center;
          color: #64748b;
        }

        .employee-empty-icon {
          width: 46px;
          height: 46px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #f1f5f9;
          color: #64748b;
        }

        .employee-empty-title {
          color: #334155;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .employee-empty-text {
          font-size: 13px;
        }

        .employee-loading {
          padding: 45px 20px;
          text-align: center;
          color: #64748b;
        }

        .employee-loading-spinner {
          width: 25px;
          height: 25px;
          margin: 0 auto 10px;
          border: 3px solid #e2e8f0;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: employeeSpin 0.8s linear infinite;
        }

        @keyframes employeeSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .employee-toast {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 9999;
          min-width: 300px;
          max-width: calc(100vw - 40px);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 14px;
          border-radius: 11px;
          background: #fff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
        }

        .employee-toast.success {
          border-left: 4px solid #16a34a;
        }

        .employee-toast.error {
          border-left: 4px solid #dc2626;
        }

        .employee-toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .employee-toast.success .employee-toast-icon {
          color: #16a34a;
        }

        .employee-toast.error .employee-toast-icon {
          color: #dc2626;
        }

        .employee-toast-message {
          flex: 1;
          color: #334155;
          font-size: 13px;
          line-height: 1.4;
        }

        .employee-toast-close {
          width: 28px;
          height: 28px;
          border: 0;
          background: transparent;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .employee-toast-close:hover {
          background: #f1f5f9;
          color: #334155;
        }

        @media (max-width: 900px) {
          .employee-table {
            min-width: 850px;
          }

          .employee-table th:nth-child(6),
          .employee-table td:nth-child(6) {
            width: 175px;
          }

          .employee-action-btn {
            padding: 0 8px;
          }
        }

        @media (max-width: 720px) {
          .employees-page {
            padding-top: 0;
          }

          .employees-header {
            align-items: stretch;
          }

          .employees-title {
            font-size: 22px;
          }

          .employees-title-icon {
            width: 38px;
            height: 38px;
          }

          .employees-subtitle {
            margin-left: 48px;
          }

          .employees-header > button {
            width: 100%;
          }

          .employee-form-top {
            align-items: flex-start;
          }

          .employee-form-body {
            padding: 16px;
          }

          .employee-form-grid {
            grid-template-columns: 1fr;
          }

          .employee-field.full {
            grid-column: auto;
          }

          .employee-form-actions {
            flex-direction: column-reverse;
          }

          .employee-form-actions button {
            width: 100%;
          }

          .employees-table-toolbar {
            align-items: stretch;
          }

          .employee-search {
            width: 100%;
          }

          .employee-toast {
            left: 15px;
            right: 15px;
            bottom: 15px;
            min-width: 0;
          }
        }
      `}</style>

      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />

      {/* PAGE HEADER */}
      <div className="employees-header">
        <div className="employees-title-wrap">
          <h1 className="employees-title">
            <span className="employees-title-icon">
              <FiUsers size={21} />
            </span>

            Employees

            <span className="employees-count">
              {employees.length}
            </span>
          </h1>

          <p className="employees-subtitle">
            Manage employee profiles, salary details and bank information.
          </p>
        </div>

        <button
          type="button"
          className="employee-primary-btn"
          onClick={showForm ? closeForm : openCreateForm}
        >
          {showForm ? (
            <>
              <FiX size={17} />
              Cancel
            </>
          ) : (
            <>
              <FiPlus size={17} />
              Add Employee
            </>
          )}
        </button>
      </div>

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <form
          className="employee-form-card"
          onSubmit={handleSubmit}
        >
          <div className="employee-form-top">
            <div>
              <h2 className="employee-form-title">
                {editingId
                  ? 'Edit Employee'
                  : 'Add New Employee'}
              </h2>

              <p className="employee-form-subtitle">
                {editingId
                  ? 'Update the employee information below.'
                  : 'Enter the employee details to create a new profile.'}
              </p>
            </div>
          </div>

          <div className="employee-form-body">
            {/* BASIC DETAILS */}
            <div className="employee-section">
              <SectionHeader
                icon={<FiUser size={18} />}
                title="Basic Details"
                description="Personal and login information"
              />

              <div className="employee-form-grid">
                <div className="employee-field">
                  <label className="employee-label">
                    Employee Code{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="emp_code"
                    value={form.emp_code}
                    onChange={handleChange}
                    className={fieldClass('emp_code')}
                    placeholder="EMP001"
                  />

                  {errors.emp_code && (
                    <div className="employee-error">
                      {errors.emp_code}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Employee Name{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={fieldClass('name')}
                    placeholder="Full name"
                  />

                  {errors.name && (
                    <div className="employee-error">
                      {errors.name}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Email{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={fieldClass('email')}
                    placeholder="employee@company.com"
                  />

                  {errors.email && (
                    <div className="employee-error">
                      {errors.email}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    {editingId
                      ? 'Password'
                      : 'Password *'}
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={fieldClass('password')}
                    placeholder={
                      editingId
                        ? 'Leave blank to keep current password'
                        : 'Create password'
                    }
                  />

                  {editingId && (
                    <div className="employee-help">
                      Leave blank to keep the existing password.
                    </div>
                  )}

                  {errors.password && (
                    <div className="employee-error">
                      {errors.password}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Designation{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    className={fieldClass('designation')}
                    placeholder="Software Engineer"
                  />

                  {errors.designation && (
                    <div className="employee-error">
                      {errors.designation}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Gender{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={`employee-select ${
                      errors.gender ? 'has-error' : ''
                    }`}
                  >
                    <option value="">
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>

                  {errors.gender && (
                    <div className="employee-error">
                      {errors.gender}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Date of Birth{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className={fieldClass('dob')}
                  />

                  {errors.dob && (
                    <div className="employee-error">
                      {errors.dob}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    PAN{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="pan"
                    value={form.pan}
                    onChange={handleChange}
                    className={fieldClass('pan')}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />

                  {errors.pan && (
                    <div className="employee-error">
                      {errors.pan}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    PF UAN{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="pf_uan"
                    value={form.pf_uan}
                    onChange={handleChange}
                    className={fieldClass('pf_uan')}
                    placeholder="12 digit UAN"
                  />

                  {errors.pf_uan && (
                    <div className="employee-error">
                      {errors.pf_uan}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* EMPLOYMENT DATES */}
            <div className="employee-section">
              <SectionHeader
                icon={<FiCalendar size={18} />}
                title="Employment Dates"
                description="Joining and resignation information"
              />

              <div className="employee-form-grid">
                <div className="employee-field">
                  <label className="employee-label">
                    Joining Date{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    type="date"
                    name="joining_date"
                    value={form.joining_date}
                    onChange={handleChange}
                    className={fieldClass('joining_date')}
                  />

                  {errors.joining_date && (
                    <div className="employee-error">
                      {errors.joining_date}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Resignation Date
                  </label>

                  <input
                    type="date"
                    name="resignation_date"
                    value={form.resignation_date}
                    onChange={handleChange}
                    className={fieldClass('resignation_date')}
                  />

                  {errors.resignation_date && (
                    <div className="employee-error">
                      {errors.resignation_date}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SALARY */}
            <div className="employee-section">
              <SectionHeader
                icon={<FiDollarSign size={18} />}
                title="Salary & Tax"
                description="CTC and monthly salary structure"
              />

              <div className="employee-form-grid">
                <div className="employee-field">
                  <label className="employee-label">
                    Annual CTC{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    type="number"
                    min="0"
                    name="ctc"
                    value={form.ctc}
                    onChange={handleChange}
                    className={fieldClass('ctc')}
                    placeholder="600000"
                  />

                  {errors.ctc && (
                    <div className="employee-error">
                      {errors.ctc}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    Tax Regime
                  </label>

                  <select
                    name="tax_regime"
                    value={form.tax_regime}
                    onChange={handleChange}
                    className="employee-select"
                  >
                    <option value="old">
                      Old Regime
                    </option>
                    <option value="new">
                      New Regime
                    </option>
                  </select>
                </div>
              </div>

              <div style={{ height: 18 }} />

              <SectionHeader
                icon={<FiDollarSign size={18} />}
                title="Monthly Salary Structure"
                description="Enter the monthly salary components"
              />

              <div className="employee-form-grid">
                {salaryKeys.map((key) => (
                  <div
                    className="employee-field"
                    key={key}
                  >
                    <label className="employee-label">
                      {key
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (char) =>
                          char.toUpperCase()
                        )}
                    </label>

                    <input
                      type="number"
                      min="0"
                      name={key}
                      value={form[key]}
                      onChange={handleChange}
                      className={fieldClass(key)}
                      placeholder="0"
                    />

                    {errors[key] && (
                      <div className="employee-error">
                        {errors[key]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* BANK */}
            <div className="employee-section">
              <SectionHeader
                icon={<FiCreditCard size={18} />}
                title="Bank Details"
                description="Salary payment account information"
              />

              <div className="employee-form-grid">
                <div className="employee-field">
                  <label className="employee-label">
                    Account Number{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="account_number"
                    value={form.account_number}
                    onChange={handleChange}
                    className={fieldClass(
                      'account_number'
                    )}
                    placeholder="Bank account number"
                  />

                  {errors.account_number && (
                    <div className="employee-error">
                      {errors.account_number}
                    </div>
                  )}
                </div>

                <div className="employee-field">
                  <label className="employee-label">
                    IFSC Code{' '}
                    <span className="employee-required">*</span>
                  </label>

                  <input
                    name="ifsc_code"
                    value={form.ifsc_code}
                    onChange={handleChange}
                    className={fieldClass('ifsc_code')}
                    placeholder="SBIN0001234"
                  />

                  {errors.ifsc_code && (
                    <div className="employee-error">
                      {errors.ifsc_code}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORM ACTIONS */}
            <div className="employee-form-actions">
              <button
                type="button"
                className="employee-secondary-btn"
                onClick={closeForm}
                disabled={saving}
              >
                <FiX size={16} />
                Cancel
              </button>

              <button
                type="submit"
                className="employee-primary-btn"
                disabled={saving}
              >
                <FiSave size={16} />

                {saving
                  ? 'Saving...'
                  : editingId
                  ? 'Update Employee'
                  : 'Save Employee'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* EMPLOYEE TABLE */}
      <div className="employees-table-card">
        <div className="employees-table-toolbar">
          <div className="employees-table-title">
            <FiUsers size={18} />
            Employee List
          </div>

          <div className="employee-search">
            <FiSearch
              className="employee-search-icon"
              size={17}
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name, code, email..."
            />
          </div>
        </div>

        <div className="employee-table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>

                {/* EMAIL INSTEAD OF DEPARTMENT */}
                <th>Email</th>

                <th>Designation</th>
                <th>CTC</th>

                {/* ACTIONS COLUMN HAS FIXED WIDTH */}
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="employee-loading">
                      <div className="employee-loading-spinner" />
                      Loading employees...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="employee-empty">
                      <div className="employee-empty-icon">
                        <FiUsers size={22} />
                      </div>

                      <div className="employee-empty-title">
                        No employees found
                      </div>

                      <div className="employee-empty-text">
                        {search
                          ? 'Try changing your search.'
                          : 'Add your first employee to get started.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <span className="employee-id">
                        #{employee.id}
                      </span>
                    </td>

                    <td>
                      <div className="employee-name-cell">
                        <div className="employee-avatar">
                          <FiUser size={16} />
                        </div>

                        <div className="employee-name-content">
                          <div className="employee-name">
                            {employee.name || '-'}
                          </div>

                          <div className="employee-code">
                            {employee.emp_code || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td>
                      <span
                        className="employee-email"
                        title={employee.email || ''}
                      >
                        {employee.email || '-'}
                      </span>
                    </td>

                    <td>
                      <span
                        className="employee-designation"
                        title={employee.designation || ''}
                      >
                        {employee.designation || '-'}
                      </span>
                    </td>

                    <td>
                      <span className="employee-ctc">
                        {money(employee.ctc)}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td>
                      <div className="employee-actions">
                        <button
                          type="button"
                          className="employee-action-btn employee-edit-btn"
                          onClick={() =>
                            openEditForm(employee)
                          }
                          title={`Edit ${employee.name || 'employee'}`}
                          aria-label={`Edit ${employee.name || 'employee'}`}
                        >
                          <FiEdit2 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="employee-action-btn employee-delete-btn"
                          onClick={() =>
                            handleDelete(employee)
                          }
                          title={`Delete ${employee.name || 'employee'}`}
                          aria-label={`Delete ${employee.name || 'employee'}`}
                        >
                          <FiTrash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}