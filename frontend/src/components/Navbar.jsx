import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COMPANY_NAME } from "../utils/constants";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <a
          href="/"
          className="group flex items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          {/* Logo */}
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <i className="fa-solid fa-wallet text-lg" />
          </span>

          {/* Brand text */}
          <span className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              PayRoll
            </span>

            <span className="mt-1 max-w-[180px] truncate text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {COMPANY_NAME}
            </span>
          </span>
        </a>

        {/* User Profile */}
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {/* Avatar */}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 ring-2 ring-white">
                {user.username?.[0]?.toUpperCase()}
              </span>

              {/* Username */}
              <span className="hidden max-w-[150px] truncate text-sm font-semibold text-slate-700 sm:block">
                {user.username}
              </span>

              {/* Chevron */}
              <i
                className={`fa-solid fa-chevron-down ml-1 text-xs text-slate-400 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown */}
            {open && (
              <>
                {/* Mobile backdrop */}
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                  onClick={() => setOpen(false)}
                />

                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60"
                >
                  {/* User info */}
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Signed in as
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {user.username}
                    </p>
                  </div>

                  {/* Sign out */}
                  <div className="p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-600"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-red-100">
                        <i className="fa-solid fa-right-from-bracket" />
                      </span>

                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}