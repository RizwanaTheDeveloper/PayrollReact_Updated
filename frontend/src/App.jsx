import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import PayslipHistory from "./pages/PayslipHistory";
import NotFound from "./pages/NotFound";
function Guard({ children, admin = false }) {
  const { user, checking } = useAuth(),
    loc = useLocation();
  if (checking) return <p>Loading…</p>;
  if (!user)
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Guard>
              <Dashboard user={user} />
            </Guard>
          }
        />
        <Route
          path="/employees/new"
          element={
            <Guard admin>
              <Employees />
            </Guard>
          }
        />
        <Route
          path="/employees/:employeeCode/edit"
          element={
            <Guard admin>
              <Employees />
            </Guard>
          }
        />
        <Route
          path="/payroll/:employeeCode"
          element={
            <Guard>
              <Payroll />
            </Guard>
          }
        />
        <Route
          path="/payslips/:employeeCode"
          element={
            <Guard>
              <PayslipHistory />
            </Guard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
