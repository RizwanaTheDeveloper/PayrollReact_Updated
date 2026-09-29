import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUsers,
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [f, setF] = useState({
    email: '',
    password: '',
  });

  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!f.email || !f.password) {
      setErr('Please enter your email and password.');
      return;
    }

    setBusy(true);
    setErr('');

    try {
      const u = await login(f.email, f.password);
      nav(`/${u.role}`);
    } catch (e) {
      setErr(
        e.response?.data?.message ||
          'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleEmailChange = (event) => {
    setF({
      ...f,
      email: event.target.value,
    });

    if (err) {
      setErr('');
    }
  };

  const handlePasswordChange = (event) => {
    setF({
      ...f,
      password: event.target.value,
    });

    if (err) {
      setErr('');
    }
  };

  return (
    <div className="login-page">
      {/* =====================================================
          LEFT BRANDING PANEL
      ===================================================== */}

      <section className="login-brand-panel">
        <div className="brand-background-circle circle-one" />
        <div className="brand-background-circle circle-two" />
        <div className="brand-background-grid" />

        <div className="brand-content">
          {/* Company */}
          <div className="company-mark">
            <div className="company-mark-icon">
              <FiShield />
            </div>

            <div>
              <strong>5 Gen Educon</strong>
              <span>Private Limited</span>
            </div>
          </div>

          {/* Main Branding */}
          <div className="brand-main">
            <div className="brand-badge">
              <FiCheckCircle />
              <span>Secure Employee Management</span>
            </div>

            <h1>
              Payroll
              <br />
              Management
              <br />
              <span>System</span>
            </h1>

            <p>
              A centralized platform to manage employees,
              attendance, leaves, payroll and payslips
              efficiently.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="brand-features">
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <FiUsers />
              </div>

              <div>
                <strong>Employee Management</strong>
                <span>
                  Manage employee information in one place.
                </span>
              </div>
            </div>

            <div className="brand-feature">
              <div className="brand-feature-icon">
                <FiCheckCircle />
              </div>

              <div>
                <strong>Attendance &amp; Leave</strong>
                <span>
                  Track attendance and leave records easily.
                </span>
              </div>
            </div>

            <div className="brand-feature">
              <div className="brand-feature-icon">
                <FiShield />
              </div>

              <div>
                <strong>Payroll &amp; Payslips</strong>
                <span>
                  Generate and manage payroll securely.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          © {new Date().getFullYear()} 5 Gen Educon Private Limited.
          All rights reserved.
        </div>
      </section>

      {/* =====================================================
          RIGHT LOGIN PANEL
      ===================================================== */}

      <section className="login-form-panel">
        <div className="login-form-wrapper">
          {/* Mobile Company Brand */}
          <div className="mobile-company-brand">
            <div className="mobile-company-icon">
              <FiShield />
            </div>

            <div>
              <strong>5 Gen Educon</strong>
              <span>Private Limited</span>
            </div>
          </div>

          {/* Login Header */}
          <div className="login-header">
            <div className="login-icon">
              <FiLock />
            </div>

            <div>
              <h2>Welcome back</h2>
              <p>
                Sign in to your Payroll Management System
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {/* Email */}
            <div className="login-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="login-input-wrapper">
                <FiMail className="login-input-icon" />

                <input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="username"
                  autoFocus
                  value={f.email}
                  onChange={handleEmailChange}
                  disabled={busy}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="login-input-wrapper">
                <FiLock className="login-input-icon" />

                <input
                  id="login-password"
                  type={show ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={f.password}
                  onChange={handlePasswordChange}
                  disabled={busy}
                />

                <button
                  type="button"
                  className="password-toggle"
                  aria-label={
                    show ? 'Hide password' : 'Show password'
                  }
                  onClick={() => setShow(!show)}
                  disabled={busy}
                >
                  {show ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Error */}
            {err && (
              <div className="login-error" role="alert">
                <div className="error-icon">
                  <FiShield />
                </div>

                <div>
                  <strong>Unable to sign in</strong>
                  <span>{err}</span>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="security-notice">
            <div className="security-icon">
              <FiShield />
            </div>

            <div>
              <strong>Secure access</strong>

              <span>
                Your account credentials are protected and
                securely processed.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <span>Payroll Management System</span>

            <span className="footer-dot">•</span>

            <span>
              {new Date().getFullYear()} 5 Gen Educon
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        /* ===================================================
           GLOBAL
        =================================================== */

        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          min-height: 100%;
          margin: 0;
          padding: 0;
        }

        body {
          overflow: hidden;
        }

        /* ===================================================
           MAIN PAGE
        =================================================== */

        .login-page {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          min-height: 100vh;
          min-height: 100dvh;

          display: grid;
          grid-template-columns:
            minmax(420px, 1fr)
            minmax(420px, 0.85fr);

          background: #f8fafc;
          overflow: hidden;
        }

        /* ===================================================
           BRAND PANEL
        =================================================== */

        .login-brand-panel {
          position: relative;
          height: 100%;
          min-height: 0;
          overflow: hidden;

          background: #0f172a;
          color: #ffffff;

          display: flex;
          flex-direction: column;
          justify-content: space-between;

          padding: clamp(25px, 4vh, 46px) 8%;
        }

        .brand-background-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .circle-one {
          width: 550px;
          height: 550px;
          right: -260px;
          top: -190px;

          border: 1px solid rgba(96, 165, 250, 0.12);

          box-shadow:
            0 0 0 80px rgba(37, 99, 235, 0.025),
            0 0 0 160px rgba(37, 99, 235, 0.02);
        }

        .circle-two {
          width: 420px;
          height: 420px;
          left: -270px;
          bottom: -230px;

          border: 1px solid rgba(96, 165, 250, 0.1);
        }

        .brand-background-grid {
          position: absolute;
          inset: 0;

          opacity: 0.07;

          background-image:
            linear-gradient(
              rgba(148, 163, 184, 0.2) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(148, 163, 184, 0.2) 1px,
              transparent 1px
            );

          background-size: 42px 42px;

          mask-image: linear-gradient(
            to bottom right,
            black,
            transparent 80%
          );

          pointer-events: none;
        }

        .brand-content {
          position: relative;
          z-index: 2;

          width: 100%;
          max-width: 620px;

          margin: auto;

          min-height: 0;
        }

        /* ===================================================
           COMPANY
        =================================================== */

        .company-mark {
          display: flex;
          align-items: center;
          gap: 12px;

          margin-bottom: clamp(25px, 6vh, 80px);
        }

        .company-mark-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;

          border-radius: 12px;

          background: #2563eb;
          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 22px;

          box-shadow:
            0 10px 25px rgba(37, 99, 235, 0.3);
        }

        .company-mark div:last-child {
          display: flex;
          flex-direction: column;
        }

        .company-mark strong {
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -0.01em;
        }

        .company-mark span {
          color: #94a3b8;
          font-size: 10px;
          margin-top: 3px;
        }

        /* ===================================================
           BRAND MAIN
        =================================================== */

        .brand-main {
          max-width: 570px;
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 7px 10px;

          border-radius: 999px;

          background: rgba(37, 99, 235, 0.13);
          border: 1px solid rgba(96, 165, 250, 0.15);

          color: #93c5fd;

          font-size: 10px;
          font-weight: 650;

          margin-bottom: 18px;
        }

        .brand-badge svg {
          width: 13px;
          height: 13px;
        }

        .brand-main h1 {
          margin: 0;

          font-size: clamp(38px, 5vw, 68px);
          line-height: 0.99;

          letter-spacing: -0.045em;
          font-weight: 800;

          color: #ffffff;
        }

        .brand-main h1 span {
          color: #60a5fa;
        }

        .brand-main p {
          max-width: 530px;

          margin: 20px 0 0;

          color: #94a3b8;

          font-size: 14px;
          line-height: 1.65;
        }

        /* ===================================================
           FEATURES
        =================================================== */

        .brand-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);

          gap: 10px;

          margin-top: clamp(22px, 4vh, 50px);
        }

        .brand-feature {
          min-width: 0;

          padding: 13px;

          border: 1px solid rgba(148, 163, 184, 0.12);

          background: rgba(255, 255, 255, 0.035);

          border-radius: 12px;

          backdrop-filter: blur(6px);
        }

        .brand-feature-icon {
          width: 32px;
          height: 32px;

          border-radius: 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: rgba(37, 99, 235, 0.18);
          color: #93c5fd;

          margin-bottom: 9px;
        }

        .brand-feature-icon svg {
          width: 15px;
          height: 15px;
        }

        .brand-feature strong {
          display: block;

          color: #e2e8f0;

          font-size: 11px;
          font-weight: 650;
          line-height: 1.4;
        }

        .brand-feature span {
          display: block;

          color: #64748b;

          font-size: 9px;
          line-height: 1.45;

          margin-top: 4px;
        }

        /* ===================================================
           BRAND FOOTER
        =================================================== */

        .brand-footer {
          position: relative;
          z-index: 2;

          color: #475569;

          font-size: 9px;

          text-align: left;

          flex-shrink: 0;
        }

        /* ===================================================
           LOGIN PANEL
        =================================================== */

        .login-form-panel {
          height: 100%;
          min-height: 0;

          background: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: clamp(20px, 4vh, 40px);
          overflow: hidden;
        }

        .login-form-wrapper {
          width: 100%;
          max-width: 420px;

          max-height: 100%;
          min-height: 0;

          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* ===================================================
           MOBILE BRAND
        =================================================== */

        .mobile-company-brand {
          display: none;
        }

        /* ===================================================
           LOGIN HEADER
        =================================================== */

        .login-header {
          display: flex;
          align-items: center;
          gap: 13px;

          margin-bottom: clamp(20px, 3vh, 30px);

          flex-shrink: 0;
        }

        .login-icon {
          width: 46px;
          height: 46px;
          min-width: 46px;

          border-radius: 13px;

          background: #eff6ff;
          color: #2563eb;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20px;
        }

        .login-header h2 {
          margin: 0;

          color: #0f172a;

          font-size: 24px;
          line-height: 1.2;
          font-weight: 750;

          letter-spacing: -0.02em;
        }

        .login-header p {
          margin: 5px 0 0;

          color: #64748b;

          font-size: 12px;
          line-height: 1.5;
        }

        /* ===================================================
           FORM
        =================================================== */

        .login-form {
          display: flex;
          flex-direction: column;

          gap: 16px;

          flex-shrink: 0;
        }

        .login-field {
          width: 100%;
        }

        .login-field label {
          display: block;

          margin-bottom: 7px;

          color: #334155;

          font-size: 12px;
          font-weight: 650;
        }

        .login-input-wrapper {
          position: relative;
          width: 100%;
        }

        .login-input-icon {
          position: absolute;

          left: 13px;
          top: 50%;

          transform: translateY(-50%);

          color: #94a3b8;

          width: 17px;
          height: 17px;

          pointer-events: none;

          z-index: 2;
        }

        .login-input-wrapper input {
          width: 100%;
          height: 46px;

          border: 1px solid #dbe3ef;
          border-radius: 10px;

          background: #ffffff;
          color: #0f172a;

          padding: 0 43px 0 40px;

          font-size: 13px;

          outline: none;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .login-input-wrapper input::placeholder {
          color: #a1aab8;
        }

        .login-input-wrapper input:hover {
          border-color: #cbd5e1;
        }

        .login-input-wrapper input:focus {
          border-color: #2563eb;

          box-shadow:
            0 0 0 3px rgba(37, 99, 235, 0.09);
        }

        .login-input-wrapper input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
        }

        /* ===================================================
           PASSWORD
        =================================================== */

        .password-toggle {
          position: absolute;

          right: 7px;
          top: 50%;

          transform: translateY(-50%);

          width: 32px;
          height: 32px;

          border: none;
          background: transparent;

          color: #94a3b8;

          border-radius: 7px;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;
        }

        .password-toggle:hover {
          background: #f1f5f9;
          color: #475569;
        }

        .password-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .password-toggle svg {
          width: 16px;
          height: 16px;
        }

        /* ===================================================
           ERROR
        =================================================== */

        .login-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          padding: 11px 12px;

          background: #fef2f2;

          border: 1px solid #fecaca;

          border-radius: 10px;

          color: #b91c1c;
        }

        .error-icon {
          width: 27px;
          height: 27px;
          min-width: 27px;

          border-radius: 7px;

          background: #fee2e2;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-icon svg {
          width: 14px;
          height: 14px;
        }

        .login-error strong {
          display: block;

          font-size: 11px;
          font-weight: 700;

          margin-bottom: 2px;
        }

        .login-error span {
          display: block;

          font-size: 10px;
          line-height: 1.45;
        }

        /* ===================================================
           SUBMIT
        =================================================== */

        .login-submit {
          width: 100%;
          height: 46px;

          border: none;
          border-radius: 10px;

          background: #2563eb;
          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          font-size: 13px;
          font-weight: 650;

          cursor: pointer;

          box-shadow:
            0 7px 18px rgba(37, 99, 235, 0.2);

          transition:
            background 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .login-submit:hover:not(:disabled) {
          background: #1d4ed8;

          transform: translateY(-1px);

          box-shadow:
            0 9px 22px rgba(37, 99, 235, 0.25);
        }

        .login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-submit svg {
          width: 16px;
          height: 16px;
        }

        .button-spinner {
          width: 15px;
          height: 15px;

          border: 2px solid rgba(255, 255, 255, 0.35);

          border-top-color: #ffffff;

          border-radius: 50%;

          animation: login-spin 0.7s linear infinite;
        }

        @keyframes login-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ===================================================
           SECURITY
        =================================================== */

        .security-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin-top: clamp(18px, 2.5vh, 26px);

          padding: 13px;

          background: #f8fafc;

          border: 1px solid #eef2f7;

          border-radius: 10px;

          flex-shrink: 0;
        }

        .security-icon {
          width: 30px;
          height: 30px;
          min-width: 30px;

          border-radius: 8px;

          background: #ecfdf5;
          color: #059669;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .security-icon svg {
          width: 14px;
          height: 14px;
        }

        .security-notice strong {
          display: block;

          color: #334155;

          font-size: 10px;
          font-weight: 700;
        }

        .security-notice span {
          display: block;

          color: #64748b;

          font-size: 9px;
          line-height: 1.5;

          margin-top: 2px;
        }

        /* ===================================================
           FOOTER
        =================================================== */

        .login-footer {
          display: flex;
          justify-content: center;
          align-items: center;

          gap: 7px;

          margin-top: clamp(18px, 2.5vh, 28px);

          color: #94a3b8;

          font-size: 9px;

          text-align: center;

          flex-shrink: 0;
        }

        .footer-dot {
          color: #cbd5e1;
        }

        /* ===================================================
           TABLET
        =================================================== */

        @media (max-width: 1000px) {
          .login-page {
            grid-template-columns:
              minmax(340px, 0.9fr)
              minmax(400px, 1fr);
          }

          .login-brand-panel {
            padding: 30px 7%;
          }

          .company-mark {
            margin-bottom: 40px;
          }

          .brand-main h1 {
            font-size: clamp(36px, 5vw, 52px);
          }

          .brand-main p {
            font-size: 12px;
            line-height: 1.55;
          }

          .brand-features {
            grid-template-columns: 1fr;

            gap: 7px;

            margin-top: 25px;
          }

          .brand-feature {
            display: flex;
            align-items: center;

            gap: 10px;

            padding: 9px;
          }

          .brand-feature-icon {
            margin-bottom: 0;
            flex-shrink: 0;
          }

          .brand-feature span {
            margin-top: 2px;
          }

          .login-form-panel {
            padding: 25px;
          }
        }

        /* ===================================================
           SHORT DESKTOP SCREENS
        =================================================== */

        @media (min-width: 761px) and (max-height: 720px) {
          .login-brand-panel {
            padding-top: 20px;
            padding-bottom: 20px;
          }

          .company-mark {
            margin-bottom: 25px;
          }

          .brand-main h1 {
            font-size: clamp(34px, 4.5vw, 50px);
          }

          .brand-main p {
            margin-top: 12px;
            font-size: 11px;
          }

          .brand-features {
            margin-top: 18px;
          }

          .brand-feature {
            padding: 9px;
          }

          .brand-feature-icon {
            width: 28px;
            height: 28px;
          }

          .brand-feature strong {
            font-size: 10px;
          }

          .brand-feature span {
            font-size: 8px;
          }

          .login-form-panel {
            padding: 18px 30px;
          }

          .login-header {
            margin-bottom: 18px;
          }

          .login-form {
            gap: 12px;
          }

          .login-input-wrapper input {
            height: 43px;
          }

          .login-submit {
            height: 43px;
          }

          .security-notice {
            margin-top: 14px;
            padding: 10px;
          }

          .login-footer {
            margin-top: 14px;
          }
        }

        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 760px) {
          .login-page {
            position: fixed;
            inset: 0;

            display: block;

            width: 100%;

            height: 100vh;
            height: 100dvh;

            min-height: 100vh;
            min-height: 100dvh;

            overflow: hidden;

            background: #f8fafc;
          }

          .login-brand-panel {
            display: none;
          }

          .login-form-panel {
            width: 100%;

            height: 100vh;
            height: 100dvh;

            min-height: 100vh;
            min-height: 100dvh;

            padding: 22px 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            overflow: hidden;
          }

          .login-form-wrapper {
            width: 100%;
            max-width: 440px;

            max-height: 100%;

            overflow: hidden;
          }

          .mobile-company-brand {
            display: flex;

            align-items: center;
            justify-content: center;

            gap: 10px;

            margin-bottom: clamp(20px, 5vh, 38px);
          }

          .mobile-company-icon {
            width: 40px;
            height: 40px;

            border-radius: 11px;

            background: #2563eb;
            color: #ffffff;

            display: flex;
            align-items: center;
            justify-content: center;

            font-size: 19px;
          }

          .mobile-company-brand div:last-child {
            display: flex;
            flex-direction: column;
          }

          .mobile-company-brand strong {
            color: #0f172a;

            font-size: 14px;
            font-weight: 750;
          }

          .mobile-company-brand span {
            color: #64748b;

            font-size: 9px;

            margin-top: 2px;
          }

          .login-header {
            margin-bottom: 22px;
          }

          .login-header h2 {
            font-size: 22px;
          }
        }

        /* ===================================================
           SMALL MOBILE
        =================================================== */

        @media (max-width: 420px) {
          .login-form-panel {
            padding: 16px 14px;
          }

          .mobile-company-brand {
            margin-bottom: 22px;
          }

          .mobile-company-icon {
            width: 36px;
            height: 36px;
            font-size: 17px;
          }

          .mobile-company-brand strong {
            font-size: 13px;
          }

          .login-icon {
            width: 40px;
            height: 40px;
            min-width: 40px;
          }

          .login-header {
            gap: 10px;
            margin-bottom: 18px;
          }

          .login-header h2 {
            font-size: 19px;
          }

          .login-header p {
            font-size: 10px;
          }

          .login-form {
            gap: 13px;
          }

          .login-input-wrapper input {
            height: 44px;
          }

          .login-submit {
            height: 44px;
          }

          .security-notice {
            margin-top: 16px;
            padding: 10px;
          }

          .login-footer {
            margin-top: 14px;
            font-size: 8px;
          }
        }

        /* ===================================================
           VERY SHORT MOBILE
        =================================================== */

        @media (max-width: 760px) and (max-height: 650px) {
          .login-form-panel {
            padding-top: 10px;
            padding-bottom: 10px;
          }

          .mobile-company-brand {
            margin-bottom: 12px;
          }

          .login-header {
            margin-bottom: 12px;
          }

          .login-form {
            gap: 9px;
          }

          .login-field label {
            margin-bottom: 4px;
          }

          .login-input-wrapper input {
            height: 40px;
          }

          .login-submit {
            height: 40px;
          }

          .security-notice {
            margin-top: 10px;
            padding: 8px;
          }

          .security-icon {
            width: 26px;
            height: 26px;
            min-width: 26px;
          }

          .login-footer {
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}