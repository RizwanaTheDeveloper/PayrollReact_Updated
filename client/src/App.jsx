import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdvancesPage from './components/AdvancesPage';

import Login from './pages/Login';

import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import AdminPayroll from './pages/admin/Payroll';
import AdminLeaves from './pages/admin/Leaves';
import AdminAttendance from './pages/admin/Attendance';
import Loans from './pages/admin/Loans';
import Reports from './pages/admin/Reports';
import EmployeeReports from './pages/admin/EmployeeReports';
import Settings from './pages/admin/Settings';

import EmpDashboard from './pages/employee/Dashboard';
import Payslips from './pages/employee/Payslips';
import Attendance from './pages/employee/Attendance';
import Leaves from './pages/employee/Leaves';
import EmployeeLoans from './pages/employee/Loans';

/* React Icons */
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiClock,
  FiCalendar,
  FiFileText,
  FiSettings
} from 'react-icons/fi';
import { FaHandHoldingUsd, FaRupeeSign } from 'react-icons/fa';


/* ---------------------------------------
   Admin Navigation
--------------------------------------- */

const adminLinks = [
  ['/admin', 'Overview', <FiHome />],
  ['/admin/employees', 'Employees', <FiUsers />],
  ['/admin/payroll', 'Payroll', <FiClipboard />],
  ['/admin/attendance', 'Attendance', <FiClock />],
  ['/admin/leaves', 'Leave', <FiCalendar />],
  ['/admin/loans', 'Loans', <FaHandHoldingUsd />],
  ['/admin/advances', 'Advances', <FaRupeeSign />],
  ['/admin/reports', 'Reports', <FiFileText />],
  ['/admin/settings', 'Settings', <FiSettings />],
];


/* ---------------------------------------
   Employee Navigation
--------------------------------------- */

const empLinks = [
  ['/employee', 'Home', <FiHome />],
  ['/employee/attendance', 'Attendance', <FiClock />],
  ['/employee/leaves', 'Leave', <FiCalendar />],
  ['/employee/payslips', 'My pay', <FiFileText />],
  ['/employee/loans', 'Loans', <FaHandHoldingUsd />],
  ['/employee/advances', 'Advances', <FaRupeeSign />],
  ['/employee/reports', 'Reports', <FiClipboard />],
  ['/employee/settings', 'Settings', <FiSettings />],
];


export default function App() {
  const { user } = useAuth();

  useEffect(() => {
    // Blur before the native wheel action so number values stay unchanged
    // and the wheel continues scrolling the page or dialog normally.
    const preventNumberWheelChange = (event) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'number'
        && document.activeElement === event.target) {
        event.target.blur();
      }
    };
    document.addEventListener('wheel', preventNumberWheelChange, { capture: true, passive: true });
    return () => document.removeEventListener('wheel', preventNumberWheelChange, { capture: true });
  }, []);

  const home = user
    ? `/${user.role}`
    : '/login';

  return (
    <Routes>

      {/* Login */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={home} replace />
            : <Login />
        }
      />


      {/* Root */}
      <Route
        path="/"
        element={
          <Navigate
            to={home}
            replace
          />
        }
      />


      {/* ---------------------------------------
          ADMIN ROUTES
      --------------------------------------- */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout links={adminLinks} />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<AdminDashboard />}
        />

        <Route
          path="employees"
          element={<Employees />}
        />

        <Route
          path="payroll"
          element={<AdminPayroll />}
        />

        <Route
          path="attendance"
          element={<AdminAttendance />}
        />

        <Route
          path="leaves"
          element={<AdminLeaves />}
        />
        <Route path="loans" element={<Loans />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/employees" element={<EmployeeReports />} />
        <Route path="reports/employees/:employeeId" element={<EmployeeReports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="advances" element={<AdvancesPage admin />} />
      </Route>


      {/* ---------------------------------------
          EMPLOYEE ROUTES
      --------------------------------------- */}

      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <Layout links={empLinks} />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<EmpDashboard />}
        />

        <Route
          path="payslips"
          element={<Payslips />}
        />

        <Route
          path="attendance"
          element={<Attendance />}
        />

        <Route
          path="leaves"
          element={<Leaves />}
        />
        <Route path="loans" element={<EmployeeLoans />} />
        <Route path="advances" element={<AdvancesPage />} />
        <Route path="reports" element={<EmployeeReports self />} />
        <Route path="settings" element={<Settings />} />
      </Route>


      {/* ---------------------------------------
          FALLBACK
      --------------------------------------- */}

      <Route
        path="*"
        element={
          <Navigate
            to={home}
            replace
          />
        }
      />

    </Routes>
  );
}
