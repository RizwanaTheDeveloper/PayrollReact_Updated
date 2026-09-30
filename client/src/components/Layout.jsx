import { useEffect, useMemo, useState } from 'react';

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiChevronRight,
  FiHome,
  FiShield,
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';

export default function Layout({ links = [] }) {
  const { user, logout } = useAuth();

  const nav = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);

  /* =========================================================
     CLOSE MENU AFTER ROUTE CHANGE
  ========================================================= */

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* =========================================================
     CLOSE MENU WITH ESCAPE
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, []);

  /* =========================================================
     PREVENT BACKGROUND SCROLL WHEN MOBILE MENU IS OPEN
  ========================================================= */

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    setOpen(false);

    logout();

    nav('/login', {
      replace: true,
    });
  };

  /* =========================================================
     USER INFORMATION
  ========================================================= */

  const userName = user?.name || 'User';

  const userRole = user?.role
    ? String(user.role).charAt(0).toUpperCase() +
      String(user.role).slice(1)
    : 'User';

  const userInitial =
    userName.trim().charAt(0).toUpperCase() || 'U';

  /* =========================================================
     CURRENT PAGE
  ========================================================= */

  const currentLink = useMemo(() => {
    const exact = links.find(
      ([to]) => pathname === to
    );

    if (exact) {
      return exact;
    }

    const nested = links
      .filter(
        ([to]) =>
          to !== '/' &&
          pathname.startsWith(`${to}/`)
      )
      .sort(
        (a, b) =>
          b[0].length - a[0].length
      )[0];

    return nested || links[0];
  }, [links, pathname]);

  const pageTitle =
    currentLink?.[1] || 'Dashboard';

  /* =========================================================
     ICON RESOLVER
  ========================================================= */

  const renderIcon = (
    icon,
    active = false
  ) => {
    if (typeof icon === 'function') {
      const Icon = icon;

      return (
        <Icon
          className={`nav-icon ${
            active ? 'active' : ''
          }`}
          aria-hidden="true"
        />
      );
    }

    if (typeof icon === 'string') {
      return (
        <span
          className="nav-icon-text"
          aria-hidden="true"
        >
          {icon}
        </span>
      );
    }

    return (
      <FiHome
        className={`nav-icon ${
          active ? 'active' : ''
        }`}
        aria-hidden="true"
      />
    );
  };

  return (
    <div className="app-layout">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`app-sidebar ${
          open ? 'sidebar-open' : ''
        }`}
        aria-label="Main navigation"
      >

        {/* ===================================================
            SIDEBAR BRAND
        =================================================== */}

        <div className="sidebar-brand">

          <div
            className="brand-logo"
            aria-hidden="true"
          >
            <FiShield />
          </div>

          <div className="brand-text">
            <strong>Payroll</strong>
            <span>Management</span>
          </div>

          {/* Mobile sidebar close button */}

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() =>
              setOpen(false)
            }
          >
            <FiX aria-hidden="true" />
          </button>

        </div>

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <div className="sidebar-navigation">

          <div className="navigation-label">
            MENU
          </div>

          <nav
            className="main-navigation"
            aria-label="Main menu"
          >

            {links.map(
              ([to, label, icon], index) => (
                <NavLink
                  key={to}
                  to={to}
                  end={index === 0}
                  className={({ isActive }) =>
                    `navigation-link ${
                      isActive
                        ? 'active'
                        : ''
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="navigation-icon-wrap">
                        {renderIcon(
                          icon,
                          isActive
                        )}
                      </span>

                      <span className="navigation-label-text">
                        {label}
                      </span>

                      {isActive && (
                        <FiChevronRight
                          className="navigation-arrow"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              )
            )}

          </nav>
        </div>

        {/* ===================================================
            SIDEBAR BOTTOM
        =================================================== */}

        <div className="sidebar-bottom">

          <div className="sidebar-user-mini">

            <div
              className="mini-avatar"
              aria-hidden="true"
            >
              {userInitial}
            </div>

            <div className="mini-user-info">

              <strong title={userName}>
                {userName}
              </strong>

              <span>
                {userRole}
              </span>

            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FiLogOut aria-hidden="true" />

            <span>
              Logout
            </span>
          </button>

        </div>
      </aside>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <button
        type="button"
        className={`sidebar-overlay ${
          open ? 'visible' : ''
        }`}
        onClick={() =>
          setOpen(false)
        }
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
      />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="app-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="app-topbar">

          {/* =================================================
              TOPBAR LEFT
          ================================================= */}

          <div className="topbar-left">

            {/* Mobile / Tablet menu */}

            <button
              type="button"
              className="mobile-menu-button"
              aria-label={
                open
                  ? 'Close navigation'
                  : 'Open navigation'
              }
              aria-expanded={open}
              onClick={() =>
                setOpen(
                  (value) => !value
                )
              }
            >
              {open ? (
                <FiX
                  aria-hidden="true"
                />
              ) : (
                <FiMenu
                  aria-hidden="true"
                />
              )}
            </button>

            {/* Mobile brand */}

            <div className="mobile-brand">

              <div
                className="mobile-brand-icon"
                aria-hidden="true"
              >
                <FiShield />
              </div>

              <span>
                Payroll
              </span>

            </div>

            {/* Desktop breadcrumb */}

            <div className="breadcrumb">

              <span
                className="breadcrumb-home"
                aria-hidden="true"
              >
                <FiHome />
              </span>

              <FiChevronRight
                className="breadcrumb-arrow"
                aria-hidden="true"
              />

              <strong>
                {pageTitle}
              </strong>

            </div>

          </div>

          {/* =================================================
              TOPBAR USER
          ================================================= */}

          <div className="topbar-user">

            <div
              className="topbar-user-avatar"
              aria-hidden="true"
            >
              {userInitial}
            </div>

            <div className="topbar-user-details">

              <strong title={userName}>
                {userName}
              </strong>

              <span>
                {userRole}
              </span>

            </div>

            <div
              className="topbar-user-icon"
              aria-hidden="true"
            >
              <FiUser />
            </div>

            {/* Mobile logout */}

            <button
              type="button"
              className="mobile-logout-button"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <FiLogOut
                aria-hidden="true"
              />
            </button>

          </div>

        </header>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main className="app-content">
          <Outlet />
        </main>

      </div>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`

        /* =====================================================
           GLOBAL RESET
        ===================================================== */

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          min-width: 0;
          min-height: 100%;
          margin: 0;
          padding: 0;
        }

        html {
          overflow-x: hidden;
        }

        body {
          overflow-x: hidden;
          background: #f8fafc;
          color: #0f172a;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        img,
        svg {
          max-width: 100%;
        }

        /* =====================================================
           APP
        ===================================================== */

        .app-layout {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;

          display: flex;

          background: #f8fafc;
          color: #0f172a;

          overflow-x: hidden;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .app-sidebar {
          position: fixed;

          left: 0;
          top: 0;
          bottom: 0;

          width: 250px;
          min-width: 250px;

          height: 100vh;
          height: 100dvh;

          z-index: 1100;

          display: flex;
          flex-direction: column;

          background: #ffffff;

          border-right: 1px solid #e5e7eb;

          box-shadow:
            2px 0 12px
            rgba(15, 23, 42, 0.03);

          overflow: hidden;

          transform: translateX(0);

          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        /* =====================================================
           SIDEBAR BRAND
        ===================================================== */

        .sidebar-brand {
          height: 72px;
          min-height: 72px;

          padding: 0 18px;

          display: flex;
          align-items: center;

          gap: 11px;

          border-bottom: 1px solid #eef2f7;

          flex-shrink: 0;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          min-width: 40px;

          border-radius: 11px;

          background: #2563eb;

          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20px;

          box-shadow:
            0 5px 12px
            rgba(37, 99, 235, 0.20);

          flex-shrink: 0;
        }

        .brand-logo svg {
          width: 20px !important;
          height: 20px !important;

          color: #ffffff !important;
          stroke: #ffffff !important;

          stroke-width: 2 !important;

          display: block;
        }

        .brand-text {
          min-width: 0;

          display: flex;
          flex-direction: column;

          line-height: 1.1;
        }

        .brand-text strong {
          color: #0f172a;

          font-size: 15px;
          font-weight: 750;
        }

        .brand-text span {
          color: #64748b;

          font-size: 11px;

          margin-top: 3px;
        }

        /* =====================================================
           SIDEBAR CLOSE
        ===================================================== */

        .sidebar-close {
          display: none;

          margin-left: auto;

          width: 40px;
          height: 40px;
          min-width: 40px;

          padding: 0;

          border: 1px solid #e2e8f0;

          border-radius: 10px;

          background: #ffffff;

          color: #0f172a;

          align-items: center;
          justify-content: center;

          cursor: pointer;

          flex-shrink: 0;

          touch-action: manipulation;

          -webkit-appearance: none;
          appearance: none;
        }

        .sidebar-close svg {
          width: 22px !important;
          height: 22px !important;

          color: #0f172a !important;
          stroke: #0f172a !important;

          stroke-width: 2.5 !important;

          opacity: 1 !important;

          visibility: visible !important;

          display: block;
        }

        .sidebar-close:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .sidebar-close:active {
          transform: scale(0.95);
        }

        /* =====================================================
           NAVIGATION
        ===================================================== */

        .sidebar-navigation {
          flex: 1;

          min-height: 0;

          overflow-y: auto;
          overflow-x: hidden;

          padding: 20px 12px;

          -webkit-overflow-scrolling: touch;

          scrollbar-width: thin;
        }

        .navigation-label {
          color: #94a3b8;

          font-size: 9px;

          font-weight: 750;

          letter-spacing: 0.08em;

          padding: 0 11px;

          margin-bottom: 8px;
        }

        .main-navigation {
          display: flex;
          flex-direction: column;

          gap: 4px;
        }

        .navigation-link {
          min-height: 44px;

          width: 100%;

          display: flex;
          align-items: center;

          gap: 11px;

          position: relative;

          padding: 6px 11px;

          border-radius: 10px;

          color: #64748b;

          text-decoration: none;

          font-size: 13px;

          font-weight: 550;

          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;

          touch-action: manipulation;
        }

        .navigation-link:hover {
          background: #f8fafc;
          color: #334155;
        }

        .navigation-link:active {
          transform: scale(0.985);
        }

        .navigation-link.active {
          background: #eff6ff;

          color: #2563eb;

          font-weight: 650;
        }

        .navigation-icon-wrap {
          width: 31px;
          height: 31px;
          min-width: 31px;

          border-radius: 8px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;
        }

        .navigation-link.active
        .navigation-icon-wrap {
          background: #dbeafe;
        }

        .nav-icon {
          width: 18px !important;
          height: 18px !important;

          color: currentColor !important;
          stroke: currentColor !important;

          stroke-width: 2 !important;

          opacity: 1 !important;

          display: block;
        }

        .nav-icon-text {
          width: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 15px;

          line-height: 1;

          color: currentColor;
        }

        .navigation-label-text {
          flex: 1;

          min-width: 0;

          overflow: hidden;

          white-space: nowrap;

          text-overflow: ellipsis;
        }

        .navigation-arrow {
          width: 15px !important;
          height: 15px !important;

          color: currentColor !important;
          stroke: currentColor !important;

          stroke-width: 2 !important;

          flex-shrink: 0;

          opacity: 0.8;
        }

        /* =====================================================
           SIDEBAR BOTTOM
        ===================================================== */

        .sidebar-bottom {
          padding: 13px;

          border-top: 1px solid #eef2f7;

          flex-shrink: 0;

          background: #ffffff;
        }

        .sidebar-user-mini {
          display: flex;
          align-items: center;

          gap: 9px;

          padding: 8px 8px 11px;

          min-width: 0;
        }

        .mini-avatar {
          width: 34px;
          height: 34px;
          min-width: 34px;

          border-radius: 9px;

          background: #eff6ff;

          color: #2563eb;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 12px;

          font-weight: 750;

          flex-shrink: 0;
        }

        .mini-user-info {
          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .mini-user-info strong {
          color: #334155;

          font-size: 11px;

          font-weight: 650;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .mini-user-info span {
          color: #94a3b8;

          font-size: 9px;

          margin-top: 2px;

          text-transform: capitalize;
        }

        /* =====================================================
           DESKTOP LOGOUT
        ===================================================== */

        .logout-button {
          width: 100%;

          min-height: 42px;

          border: 1px solid #e5e7eb;

          background: #ffffff;

          color: #64748b;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          padding: 8px 12px;

          font-size: 12px;

          font-weight: 600;

          cursor: pointer;

          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;

          touch-action: manipulation;
        }

        .logout-button svg {
          width: 17px !important;
          height: 17px !important;

          color: currentColor !important;
          stroke: currentColor !important;

          stroke-width: 2 !important;

          display: block;

          flex-shrink: 0;
        }

        .logout-button:hover {
          background: #fef2f2;

          border-color: #fecaca;

          color: #dc2626;
        }

        .logout-button:active {
          transform: scale(0.98);
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .app-main {
          width: calc(100% - 250px);

          min-width: 0;

          margin-left: 250px;

          min-height: 100vh;
          min-height: 100dvh;

          display: flex;
          flex-direction: column;
        }

        /* =====================================================
           TOPBAR
        ===================================================== */

        .app-topbar {
          height: 72px;
          min-height: 72px;

          width: 100%;

          position: sticky;

          top: 0;

          z-index: 900;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 15px;

          padding: 0 25px;

          background: rgba(
            255,
            255,
            255,
            0.97
          );

          border-bottom: 1px solid #e5e7eb;

          backdrop-filter: blur(10px);

          -webkit-backdrop-filter: blur(10px);
        }

        .topbar-left {
          min-width: 0;

          display: flex;

          align-items: center;

          gap: 14px;
        }

        /* =====================================================
           MOBILE MENU BUTTON
        ===================================================== */

        .mobile-menu-button {
          display: none;

          width: 42px;
          height: 42px;
          min-width: 42px;

          padding: 0;

          border: 1px solid #cbd5e1;

          background: #ffffff;

          color: #0f172a;

          border-radius: 10px;

          align-items: center;
          justify-content: center;

          cursor: pointer;

          touch-action: manipulation;

          flex-shrink: 0;

          -webkit-appearance: none;
          appearance: none;
        }

        .mobile-menu-button svg {
          width: 24px !important;
          height: 24px !important;

          color: #0f172a !important;
          stroke: #0f172a !important;

          stroke-width: 2.5 !important;

          opacity: 1 !important;

          visibility: visible !important;

          display: block;
        }

        .mobile-menu-button:hover {
          background: #f8fafc;

          border-color: #94a3b8;
        }

        .mobile-menu-button:active {
          background: #eff6ff;

          border-color: #2563eb;

          transform: scale(0.95);
        }

        .mobile-menu-button:focus-visible {
          outline: 3px solid
            rgba(37, 99, 235, 0.20);

          outline-offset: 2px;
        }

        /* =====================================================
           MOBILE BRAND
        ===================================================== */

        .mobile-brand {
          display: none;

          align-items: center;

          gap: 7px;

          min-width: 0;

          color: #0f172a;

          font-size: 13px;

          font-weight: 750;

          white-space: nowrap;
        }

        .mobile-brand-icon {
          width: 30px;
          height: 30px;
          min-width: 30px;

          border-radius: 8px;

          background: #2563eb;

          color: #ffffff;

          display: flex;

          align-items: center;
          justify-content: center;
        }

        .mobile-brand-icon svg {
          width: 16px !important;
          height: 16px !important;

          color: #ffffff !important;
          stroke: #ffffff !important;

          stroke-width: 2 !important;

          display: block;
        }

        /* =====================================================
           BREADCRUMB
        ===================================================== */

        .breadcrumb {
          display: flex;

          align-items: center;

          gap: 8px;

          min-width: 0;

          color: #64748b;

          font-size: 12px;
        }

        .breadcrumb-home {
          width: 28px;
          height: 28px;
          min-width: 28px;

          border-radius: 8px;

          background: #f8fafc;

          display: flex;

          align-items: center;
          justify-content: center;

          color: #64748b;
        }

        .breadcrumb-home svg {
          width: 15px !important;
          height: 15px !important;

          color: currentColor !important;
          stroke: currentColor !important;

          stroke-width: 2 !important;
        }

        .breadcrumb-arrow {
          width: 14px !important;
          height: 14px !important;

          color: #cbd5e1 !important;
          stroke: #cbd5e1 !important;

          flex-shrink: 0;
        }

        .breadcrumb strong {
          color: #334155;

          font-size: 12px;

          font-weight: 650;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        /* =====================================================
           TOPBAR USER
        ===================================================== */

        .topbar-user {
          display: flex;

          align-items: center;

          gap: 9px;

          min-width: 0;

          flex-shrink: 0;
        }

        .topbar-user-avatar {
          width: 37px;
          height: 37px;
          min-width: 37px;

          border-radius: 10px;

          background: #2563eb;

          color: #ffffff;

          display: flex;

          align-items: center;
          justify-content: center;

          font-size: 13px;

          font-weight: 750;

          flex-shrink: 0;
        }

        .topbar-user-details {
          min-width: 0;

          max-width: 180px;

          display: flex;

          flex-direction: column;

          align-items: flex-start;
        }

        .topbar-user-details strong {
          max-width: 100%;

          color: #334155;

          font-size: 12px;

          font-weight: 650;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .topbar-user-details span {
          color: #94a3b8;

          font-size: 10px;

          margin-top: 2px;

          text-transform: capitalize;

          white-space: nowrap;
        }

        .topbar-user-icon {
          width: 30px;
          height: 30px;
          min-width: 30px;

          border-radius: 8px;

          background: #f8fafc;

          color: #94a3b8;

          display: flex;

          align-items: center;
          justify-content: center;
        }

        .topbar-user-icon svg {
          width: 15px !important;
          height: 15px !important;

          color: currentColor !important;
          stroke: currentColor !important;

          stroke-width: 2 !important;
        }

        /* =====================================================
           MOBILE LOGOUT
        ===================================================== */

        .mobile-logout-button {
          display: none;

          width: 42px;
          height: 42px;
          min-width: 42px;

          padding: 0;

          border: 1px solid #cbd5e1;

          border-radius: 10px;

          background: #ffffff;

          color: #0f172a;

          align-items: center;
          justify-content: center;

          cursor: pointer;

          flex-shrink: 0;

          touch-action: manipulation;

          -webkit-appearance: none;
          appearance: none;
        }

        .mobile-logout-button svg {
          width: 22px !important;
          height: 22px !important;

          color: #0f172a !important;
          stroke: #0f172a !important;

          stroke-width: 2.3 !important;

          opacity: 1 !important;

          visibility: visible !important;

          display: block;
        }

        .mobile-logout-button:hover {
          background: #fef2f2;

          border-color: #fecaca;

          color: #dc2626;
        }

        .mobile-logout-button:hover svg {
          color: #dc2626 !important;
          stroke: #dc2626 !important;
        }

        .mobile-logout-button:active {
          background: #fef2f2;

          border-color: #fca5a5;

          transform: scale(0.95);
        }

        .mobile-logout-button:focus-visible {
          outline: 3px solid
            rgba(37, 99, 235, 0.20);

          outline-offset: 2px;
        }

        /* =====================================================
           CONTENT
        ===================================================== */

        .app-content {
          width: 100%;

          min-width: 0;

          flex: 1;

          padding: 24px;

          overflow-x: hidden;
        }

        /* =====================================================
           OVERLAY
        ===================================================== */

        .sidebar-overlay {
          display: none;
        }

        /* =====================================================
           LARGE LAPTOPS
        ===================================================== */

        @media (max-width: 1200px) {

          .app-sidebar {
            width: 235px;
            min-width: 235px;
          }

          .app-main {
            width: calc(100% - 235px);

            margin-left: 235px;
          }

          .app-topbar {
            padding-left: 20px;
            padding-right: 20px;
          }

          .app-content {
            padding: 20px;
          }

        }

        /* =====================================================
           TABLET / SMALL LAPTOP
           <= 900px
        ===================================================== */

        @media (max-width: 900px) {

          .app-sidebar {
            width: min(300px, 88vw);

            min-width: min(300px, 88vw);

            transform: translateX(-105%);

            box-shadow:
              10px 0 35px
              rgba(15, 23, 42, 0.16);
          }

          .app-sidebar.sidebar-open {
            transform: translateX(0);
          }

          .app-main {
            width: 100%;

            margin-left: 0;
          }

          .mobile-menu-button {
            display: flex;
          }

          .sidebar-close {
            display: flex;
          }

          .sidebar-overlay {
            display: block;

            position: fixed;

            inset: 0;

            z-index: 1050;

            width: 100%;
            height: 100%;

            padding: 0;
            margin: 0;

            border: none;

            background:
              rgba(
                15,
                23,
                42,
                0.42
              );

            opacity: 0;

            pointer-events: none;

            transition:
              opacity 0.25s ease;

            cursor: pointer;
          }

          .sidebar-overlay.visible {
            opacity: 1;

            pointer-events: auto;
          }

          .app-topbar {
            padding-left: 18px;
            padding-right: 18px;
          }

          .app-content {
            padding: 20px;
          }

          .mobile-logout-button {
            display: flex;
          }

        }

        /* =====================================================
           TABLETS
           601px - 900px
        ===================================================== */

        @media (min-width: 601px) and (max-width: 900px) {

          .app-topbar {
            height: 68px;
            min-height: 68px;
          }

          .mobile-menu-button {
            width: 42px;
            height: 42px;
            min-width: 42px;
          }

          .mobile-logout-button {
            width: 42px;
            height: 42px;
            min-width: 42px;
          }

          .mobile-menu-button svg {
            width: 23px !important;
            height: 23px !important;
          }

          .mobile-logout-button svg {
            width: 21px !important;
            height: 21px !important;
          }

        }

        /* =====================================================
           MOBILE
           <= 600px
        ===================================================== */

        @media (max-width: 600px) {

          .app-topbar {
            height: 62px;
            min-height: 62px;

            padding-top: 0;

            padding-right:
              max(
                12px,
                env(safe-area-inset-right)
              );

            padding-bottom: 0;

            padding-left:
              max(
                12px,
                env(safe-area-inset-left)
              );
          }

          .topbar-left {
            gap: 9px;

            min-width: 0;

            flex: 1;
          }

          .mobile-menu-button {
            width: 40px;
            height: 40px;
            min-width: 40px;

            border-radius: 10px;
          }

          .mobile-menu-button svg {
            width: 23px !important;
            height: 23px !important;

            color: #0f172a !important;
            stroke: #0f172a !important;

            stroke-width: 2.5 !important;
          }

          .mobile-brand {
            display: flex;

            min-width: 0;

            overflow: hidden;
          }

          .mobile-brand span {
            overflow: hidden;

            white-space: nowrap;

            text-overflow: ellipsis;
          }

          .breadcrumb {
            display: none;
          }

          .topbar-user {
            gap: 6px;
          }

          .topbar-user-details,
          .topbar-user-icon {
            display: none;
          }

          .topbar-user-avatar {
            width: 36px;
            height: 36px;
            min-width: 36px;

            border-radius: 9px;

            font-size: 12px;
          }

          .mobile-logout-button {
            width: 40px;
            height: 40px;
            min-width: 40px;

            border-radius: 10px;
          }

          .mobile-logout-button svg {
            width: 21px !important;
            height: 21px !important;

            color: #0f172a !important;
            stroke: #0f172a !important;

            stroke-width: 2.3 !important;
          }

          .app-content {
            width: 100%;

            max-width: 100%;

            padding-top: 16px;

            padding-right:
              max(
                12px,
                env(safe-area-inset-right)
              );

            padding-bottom: 20px;

            padding-left:
              max(
                12px,
                env(safe-area-inset-left)
              );

            overflow-x: hidden;
          }

          .sidebar-bottom {
            padding-top: 12px;

            padding-right:
              max(
                12px,
                env(safe-area-inset-right)
              );

            padding-bottom:
              calc(
                12px +
                env(safe-area-inset-bottom)
              );

            padding-left:
              max(
                12px,
                env(safe-area-inset-left)
              );
          }

          .sidebar-user-mini {
            padding-bottom: 10px;
          }

          .logout-button {
            min-height: 44px;
          }

        }

        /* =====================================================
           PHONES <= 430px
        ===================================================== */

        @media (max-width: 430px) {

          .app-topbar {
            gap: 8px;
          }

          .topbar-left {
            gap: 8px;
          }

          .mobile-menu-button,
          .mobile-logout-button {
            width: 39px;
            height: 39px;
            min-width: 39px;
          }

          .mobile-menu-button svg {
            width: 22px !important;
            height: 22px !important;
          }

          .mobile-logout-button svg {
            width: 20px !important;
            height: 20px !important;
          }

          .mobile-brand {
            font-size: 12px;
          }

          .mobile-brand-icon {
            width: 29px;
            height: 29px;
            min-width: 29px;
          }

          .mobile-brand-icon svg {
            width: 15px !important;
            height: 15px !important;
          }

          .topbar-user-avatar {
            width: 34px;
            height: 34px;
            min-width: 34px;
          }

          .app-content {
            padding-top: 14px;
          }

          .app-sidebar {
            width: min(285px, 90vw);

            min-width: min(285px, 90vw);
          }

        }

        /* =====================================================
           VERY SMALL PHONES <= 360px
        ===================================================== */

        @media (max-width: 360px) {

          .app-topbar {
            padding-left: 9px;
            padding-right: 9px;
          }

          .topbar-left {
            gap: 6px;
          }

          .mobile-brand {
            display: none;
          }

          .mobile-menu-button,
          .mobile-logout-button {
            width: 38px;
            height: 38px;
            min-width: 38px;

            border-radius: 9px;
          }

          .mobile-menu-button svg {
            width: 21px !important;
            height: 21px !important;
          }

          .mobile-logout-button svg {
            width: 19px !important;
            height: 19px !important;
          }

          .topbar-user-avatar {
            width: 32px;
            height: 32px;
            min-width: 32px;

            border-radius: 8px;
          }

          .app-content {
            padding-left: 10px;
            padding-right: 10px;
          }

          .app-sidebar {
            width: min(280px, 90vw);

            min-width: min(280px, 90vw);
          }

        }

        /* =====================================================
           LANDSCAPE PHONES
        ===================================================== */

        @media
          (max-width: 900px)
          and (orientation: landscape) {

          .app-topbar {
            height: 58px;
            min-height: 58px;
          }

          .app-sidebar {
            width: min(300px, 55vw);

            min-width: min(300px, 55vw);
          }

          .sidebar-brand {
            height: 60px;
            min-height: 60px;
          }

          .sidebar-navigation {
            padding-top: 12px;

            padding-bottom: 12px;
          }

          .sidebar-bottom {
            padding-top: 8px;

            padding-bottom: 8px;
          }

          .sidebar-user-mini {
            padding-top: 4px;

            padding-bottom: 6px;
          }

        }

        /* =====================================================
           IPHONE / IOS SAFE AREA
        ===================================================== */

        @supports (-webkit-touch-callout: none) {

          .app-layout {
            min-height:
              -webkit-fill-available;
          }

          .app-sidebar {
            height:
              -webkit-fill-available;
          }

          .app-main {
            min-height:
              -webkit-fill-available;
          }

        }

        /* =====================================================
           ACCESSIBILITY
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .app-sidebar,
          .sidebar-overlay,
          .navigation-link,
          .logout-button,
          .mobile-menu-button,
          .mobile-logout-button,
          .sidebar-close {
            transition: none !important;
          }

        }

        /* =====================================================
           TOUCH DEVICES
        ===================================================== */

        @media (hover: none) {

          .navigation-link:hover {
            background: transparent;
          }

          .logout-button:hover {
            background: #ffffff;
            border-color: #e5e7eb;
            color: #64748b;
          }

          .mobile-menu-button:hover {
            background: #ffffff;
            border-color: #cbd5e1;
          }

          .mobile-logout-button:hover {
            background: #ffffff;
            border-color: #cbd5e1;
            color: #0f172a;
          }

          .sidebar-close:hover {
            background: #ffffff;
            border-color: #e2e8f0;
          }

        }

        /* =====================================================
           FOCUS STATES
        ===================================================== */

        .navigation-link:focus-visible,
        .logout-button:focus-visible,
        .sidebar-close:focus-visible {
          outline: 3px solid
            rgba(37, 99, 235, 0.20);

          outline-offset: 2px;
        }

      `}</style>
    </div>
  );
}