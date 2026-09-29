import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';

import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import AdminPayroll from './pages/admin/Payroll';
import AdminLeaves from './pages/admin/Leaves';
import AdminAttendance from './pages/admin/Attendance';

import EmpDashboard from './pages/employee/Dashboard';
import Payslips from './pages/employee/Payslips';
import Attendance from './pages/employee/Attendance';
import Leaves from './pages/employee/Leaves';

/* React Icons */
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiClock,
  FiCalendar,
  FiFileText
} from 'react-icons/fi';


/* ---------------------------------------
   Admin Navigation
--------------------------------------- */

const adminLinks = [
  ['/admin', 'Dashboard', <FiHome />],
  ['/admin/employees', 'Employees', <FiUsers />],
  ['/admin/payroll', 'Payroll', <FiDollarSign />],
  ['/admin/attendance', 'Attendance', <FiClock />],
  ['/admin/leaves', 'Leaves', <FiCalendar />],
];


/* ---------------------------------------
   Employee Navigation
--------------------------------------- */

const empLinks = [
  ['/employee', 'Dashboard', <FiHome />],
  ['/employee/payslips', 'Payslips', <FiFileText />],
  ['/employee/attendance', 'Attendance', <FiClock />],
  ['/employee/leaves', 'Leaves', <FiCalendar />],
];


export default function App() {
  const { user } = useAuth();

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