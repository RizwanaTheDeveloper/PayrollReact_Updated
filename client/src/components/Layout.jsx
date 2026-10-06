import { isValidElement, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import ReportsNavigation from './ReportsNavigation';

function NavIcon({ icon }) {
  if (isValidElement(icon)) return icon;
  if (typeof icon === 'function') { const Icon = icon; return <Icon />; }
  return <FiHome />;
}

export default function Layout({ links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const sidebar = useRef(null);
  const isEmployee = user?.role === 'employee';
  const isReports = pathname === '/admin/reports' || pathname.startsWith('/admin/reports/');
  const userName = user?.name || 'User';
  const initials = userName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const pageTitle = (links.find(([to]) => to === pathname)
    || [...links].reverse().find(([to]) => pathname.startsWith(`${to}/`)))?.[1] || 'Payroll';

  function closeMenu() { setOpen(false); menuButton.current?.focus(); }
  function signOut() { logout(); navigate('/login', { replace: true }); }

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)');
    const onResize = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', onResize);
    return () => desktop.removeEventListener('change', onResize);
  }, []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector('button')?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); }
      if (event.key === 'Tab') {
        const controls = [...sidebar.current.querySelectorAll('a, button')].filter((element) => element.getClientRects().length);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [open]);

  return (
    <div className={`design-app ${isEmployee ? 'design-employee-app' : ''} ${isReports ? 'design-reports-app' : ''}`}>
      <a className="design-skip-link" href="#workspace-content">Skip to content</a>
      {open && <button className="design-sidebar-overlay" aria-label="Close navigation" onClick={closeMenu} />}
      <aside id="workspace-navigation" ref={sidebar} className={`design-sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation">
        <div className="design-sidebar-brand"><div className="design-company"><span className="design-logo" aria-hidden="true">5G</span><div><strong>5 Gen Payroll</strong><span>5 Gen Educon</span></div></div><button className="design-close-menu" type="button" aria-label="Close menu" onClick={closeMenu}><FiX /></button></div>
        <p className="design-workspace-label">{isEmployee ? 'Employee portal' : 'Admin workspace'}</p>
        <nav className="design-navigation" aria-label="Main menu">{links.map(([to, label, icon], index) => <NavLink key={to} to={to} end={index === 0} className={({ isActive }) => `design-nav-link ${isActive ? 'is-active' : ''}`}><span aria-hidden="true"><NavIcon icon={icon} /></span>{label}</NavLink>)}</nav>
        <div className="design-sidebar-bottom"><div className="design-user"><span className="design-user-avatar" aria-hidden="true">{initials}</span><div><strong>{userName}</strong><span>{isEmployee ? 'Employee' : 'Payroll administrator'}</span></div></div><button className="design-logout" type="button" onClick={signOut}><FiLogOut aria-hidden="true" />Sign out</button></div>
      </aside>
      <div className="design-app-main">
        <header className="design-topbar"><div className="design-topbar-left"><button ref={menuButton} className="design-open-menu" type="button" aria-label="Open navigation" aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)}><FiMenu /></button><span className="design-topbar-title">{pageTitle}</span></div><div className="design-topbar-right"><span className="design-topbar-workspace">{isEmployee ? 'My workspace' : 'Payroll workspace'}</span><span className="design-user-avatar" aria-label={userName}>{initials}</span></div></header>
        {isReports && <ReportsNavigation />}
        <main id="workspace-content" className="design-content" tabIndex={-1}><Outlet /></main>
        {isEmployee && <nav className="design-bottom-navigation" aria-label="Employee shortcuts">{links.map(([to, label, icon], index) => <NavLink key={to} to={to} end={index === 0} className={({ isActive }) => isActive ? 'is-active' : ''}><span aria-hidden="true"><NavIcon icon={icon} /></span><span>{label}</span></NavLink>)}</nav>}
      </div>
    </div>
  );
}
