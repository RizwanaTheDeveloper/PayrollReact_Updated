import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { COMPANY_NAME } from "../utils/constants";

export default function Layout() {
  return (
    <>
      <Navbar />

      <main className="container">
        <Outlet />
      </main>

      <footer>
        {COMPANY_NAME} · PayRoll
      </footer>
    </>
  );
}