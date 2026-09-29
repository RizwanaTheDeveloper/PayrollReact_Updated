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

  /* -------------------------------------------------------
     Close mobile menu after navigation
  ------------------------------------------------------- */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* -------------------------------------------------------
     Close mobile menu with Escape
  ------------------------------------------------------- */
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  /* -------------------------------------------------------
     Prevent body scroll when mobile sidebar is open
  ------------------------------------------------------- */
  useEffect(() => {
    if (open && window.innerWidth <= 900) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /* -------------------------------------------------------
     Logout
  ------------------------------------------------------- */
  const handleLogout = () => {
    logout();
    nav('/login');
  };

  /* -------------------------------------------------------
     User information
  ------------------------------------------------------- */
  const userName = user?.name || 'User';

  const userRole = user?.role
    ? String(user.role)
        .charAt(0)
        .toUpperCase() +
      String(user.role).slice(1)
    : 'User';

  const userInitial = userName
    .trim()
    .charAt(0)
    .toUpperCase() || 'U';

  /* -------------------------------------------------------
     Find current page
  ------------------------------------------------------- */
  const currentLink = useMemo(() => {
    const exact = links.find(([to]) => pathname === to);

    if (exact) return exact;

    const nested = links
      .filter(([to]) => to !== '/' && pathname.startsWith(`${to}/`))
      .sort((a, b) => b[0].length - a[0].length)[0];

    return nested || links[0];
  }, [links, pathname]);

  const pageTitle = currentLink?.[1] || 'Dashboard';

  /* -------------------------------------------------------
     Icon resolver
  ------------------------------------------------------- */
  const renderIcon = (icon, active = false) => {
    /*
      New format:
      ['/', 'Dashboard', FiHome]
    */
    if (typeof icon === 'function') {
      const Icon = icon;

      return (
        <Icon
          className={`nav-icon ${active ? 'active' : ''}`}
          aria-hidden="true"
        />
      );
    }

    /*
      Backward compatibility:
      If an older link contains a string icon,
      don't break the navigation.
    */
    if (typeof icon === 'string') {
      return (
        <span className="nav-icon-text" aria-hidden="true">
          {icon}
        </span>
      );
    }

    return (
      <FiHome
        className={`nav-icon ${active ? 'active' : ''}`}
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
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-logo">
            <FiShield />
          </div>

          <div className="brand-text">
            <strong>Payroll</strong>
            <span>Management</span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <FiX />
          </button>
        </div>

        {/* Navigation */}
        <div className="sidebar-navigation">
          <div className="navigation-label">
            MENU
          </div>

          <nav className="main-navigation">
            {links.map(([to, label, icon], index) => (
              <NavLink
                key={to}
                to={to}
                end={index === 0}
                className={({ isActive }) =>
                  `navigation-link ${
                    isActive ? 'active' : ''
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="navigation-icon-wrap">
                      {renderIcon(icon, isActive)}
                    </span>

                    <span className="navigation-label-text">
                      {label}
                    </span>

                    {isActive && (
                      <FiChevronRight className="navigation-arrow" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-user-mini">
            <div className="mini-avatar">
              {userInitial}
            </div>

            <div className="mini-user-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <div
        className={`sidebar-overlay ${
          open ? 'visible' : ''
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label={
                open ? 'Close navigation' : 'Open navigation'
              }
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <FiX /> : <FiMenu />}
            </button>

            <div className="mobile-brand">
              <div className="mobile-brand-icon">
                <FiShield />
              </div>

              <span>Payroll</span>
            </div>

            <div className="breadcrumb">
              <span className="breadcrumb-home">
                <FiHome />
              </span>

              <FiChevronRight className="breadcrumb-arrow" />

              <strong>{pageTitle}</strong>
            </div>
          </div>

          {/* User */}
          <div className="topbar-user">
            <div className="topbar-user-avatar">
              {userInitial}
            </div>

            <div className="topbar-user-details">
              <strong>{userName}</strong>

              <span>
                {userRole}
              </span>
            </div>

            <div className="topbar-user-icon">
              <FiUser />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        .app-layout {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: #f8fafc;
          color: #0f172a;
        }

        /* ===================================================
           SIDEBAR
        =================================================== */

        .app-sidebar {
          width: 250px;
          min-width: 250px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-right: 1px solid #e5e7eb;
          box-shadow: 2px 0 12px rgba(15, 23, 42, 0.03);
        }

        /* Brand */

        .sidebar-brand {
          height: 72px;
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
          box-shadow: 0 5px 12px rgba(37, 99, 235, 0.2);
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

        .sidebar-close {
          display: none;
        }

        /* Navigation */

        .sidebar-navigation {
          flex: 1;
          overflow-y: auto;
          padding: 20px 12px;
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
          padding: 0 11px;
          border-radius: 10px;
          color: #64748b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 550;
          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;
        }

        .navigation-link:hover {
          background: #f8fafc;
          color: #334155;
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
        }

        .navigation-link.active
          .navigation-icon-wrap {
          background: #dbeafe;
        }

        .nav-icon {
          width: 17px;
          height: 17px;
          stroke-width: 1.9;
        }

        .nav-icon-text {
          width: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          line-height: 1;
        }

        .navigation-label-text {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .navigation-arrow {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          opacity: 0.7;
        }

        /* Sidebar bottom */

        .sidebar-bottom {
          padding: 13px;
          border-top: 1px solid #eef2f7;
          flex-shrink: 0;
        }

        .sidebar-user-mini {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 8px 11px;
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

        .logout-button {
          width: 100%;
          height: 38px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #64748b;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .logout-button svg {
          width: 15px;
          height: 15px;
        }

        .logout-button:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #dc2626;
        }

        /* ===================================================
           MAIN
        =================================================== */

        .app-main {
          width: calc(100% - 250px);
          min-width: 0;
          margin-left: 250px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ===================================================
           TOPBAR
        =================================================== */

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
          background: rgba(255, 255, 255, 0.96);
          border-bottom: 1px solid #e5e7eb;
          backdrop-filter: blur(10px);
        }

        .topbar-left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .mobile-menu-button {
          display: none;
          width: 38px;
          height: 38px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #334155;
          border-radius: 9px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mobile-menu-button svg {
          width: 19px;
          height: 19px;
        }

        .mobile-brand {
          display: none;
        }

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
          border-radius: 8px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .breadcrumb-home svg {
          width: 14px;
          height: 14px;
        }

        .breadcrumb-arrow {
          width: 13px;
          height: 13px;
          color: #cbd5e1;
        }

        .breadcrumb strong {
          color: #334155;
          font-size: 12px;
          font-weight: 650;
          white-space: nowrap;
        }

        /* Topbar user */

        .topbar-user {
          display: flex;
          align-items: center;
          gap: 9px;
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
        }

        .topbar-user-details {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .topbar-user-details strong {
          max-width: 170px;
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
        }

        .topbar-user-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #f8fafc;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 2px;
        }

        .topbar-user-icon svg {
          width: 14px;
          height: 14px;
        }

        /* ===================================================
           CONTENT
        =================================================== */

        .app-content {
          width: 100%;
          flex: 1;
          padding: 24px;
          min-width: 0;
        }

        /* ===================================================
           OVERLAY
        =================================================== */

        .sidebar-overlay {
          display: none;
        }

        /* ===================================================
           TABLET
        =================================================== */

        @media (max-width: 900px) {
          .app-sidebar {
            width: 260px;
            min-width: 260px;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 8px 0 30px rgba(15, 23, 42, 0.12);
          }

          .app-sidebar.sidebar-open {
            transform: translateX(0);
          }

          .sidebar-close {
            margin-left: auto;
            width: 32px;
            height: 32px;
            border: none;
            background: #f8fafc;
            color: #64748b;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }

          .sidebar-close svg {
            width: 17px;
            height: 17px;
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 950;
            background: rgba(15, 23, 42, 0.35);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
          }

          .sidebar-overlay.visible {
            opacity: 1;
            pointer-events: auto;
          }

          .app-main {
            width: 100%;
            margin-left: 0;
          }

          .mobile-menu-button {
            display: flex;
          }

          .app-topbar {
            padding: 0 18px;
          }

          .app-content {
            padding: 20px;
          }
        }

        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 600px) {
          .app-topbar {
            height: 62px;
            min-height: 62px;
            padding: 0 13px;
          }

          .mobile-menu-button {
            width: 36px;
            height: 36px;
          }

          .mobile-brand {
            display: flex;
            align-items: center;
            gap: 7px;
            color: #0f172a;
            font-size: 13px;
            font-weight: 750;
          }

          .mobile-brand-icon {
            width: 29px;
            height: 29px;
            border-radius: 8px;
            background: #2563eb;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .mobile-brand-icon svg {
            width: 14px;
            height: 14px;
          }

          .breadcrumb {
            display: none;
          }

          .topbar-user-details,
          .topbar-user-icon {
            display: none;
          }

          .topbar-user-avatar {
            width: 34px;
            height: 34px;
            min-width: 34px;
            border-radius: 9px;
          }

          .app-content {
            padding: 16px 12px;
          }

          .app-sidebar {
            width: min(290px, 88vw);
            min-width: min(290px, 88vw);
          }
        }

        @media (max-width: 360px) {
          .mobile-brand {
            display: none;
          }

          .app-content {
            padding: 14px 10px;
          }
        }
      `}</style>
    </div>
  );
}