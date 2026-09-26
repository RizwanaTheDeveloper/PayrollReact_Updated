import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { useToast } from "../context/ToastContext";
import { COMPANY_NAME } from "../utils/constants";
export default function Layout() {
  const { toasts } = useToast();
  return (
    <>
      <Navbar />
      <main className="container">
        {toasts.map((t) => (
          <div className={`toast ${t.type}`} key={t.id}>
            {t.message}
          </div>
        ))}
        <Outlet />
      </main>
      <footer>{COMPANY_NAME} · PayRoll</footer>
    </>
  );
}
