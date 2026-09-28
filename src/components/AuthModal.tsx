/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import LucoLogo from './LucoLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRoleChooser: () => void;
}

export default function AuthModal({ isOpen, onClose, onOpenRoleChooser }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const isPwValid = password.length >= 8;

    setEmailError(!isEmailValid);
    setPasswordError(!isPwValid);

    if (isEmailValid && isPwValid) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage('Signed in successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1100);
      }, 700);
    }
  };

  const handleSocialAuth = (provider: string) => {
    alert(`Connect ${provider} OAuth here to enable this button.`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: '#141A33',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        WebkitOverflowScrolling: 'touch'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '24px',
          overflow: 'hidden',
          background: '#FFFFFF',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.55)',
          margin: 'auto'
        }}
      >
        {/* Subtle Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 30,
            transition: 'background .15s'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* HERO HEADER */}
        <header
          style={{
            background: 'radial-gradient(120% 140% at 85% 0%, rgba(91,33,214,0.35), transparent 55%), linear-gradient(160deg, #141A33 0%, #26246E 55%, #5B21D6 100%)',
            padding: '32px 26px 48px 26px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative circular line in top right (exact match to screenshot & html) */}
          <div
            style={{
              position: 'absolute',
              right: '-40px',
              top: '-40px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              border: '1px solid rgba(200, 190, 255, 0.18)',
              pointerEvents: 'none'
            }}
          />

          {/* Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}
            >
              <LucoLogo size={22} />
            </div>
            <span
              style={{
                color: '#F3F1FC',
                fontFamily: "'Fraunces', serif",
                fontSize: '18px',
                letterSpacing: '0.02em',
                fontWeight: 600
              }}
            >
              LucoHire
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 500,
              fontSize: '26px',
              lineHeight: 1.2,
              color: '#FBFAFF',
              margin: '24px 0 8px 0',
              maxWidth: '280px'
            }}
          >
            Welcome back to LucoHire
          </h1>
          <p
            style={{
              color: '#CCD0E8',
              fontSize: '13.5px',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '290px'
            }}
          >
            Sign in to manage your gigs, or create a free profile to start getting hired.
          </p>
        </header>

        {/* SHEET / FORM */}
        <main
          style={{
            background: '#FFFFFF',
            borderRadius: '24px 24px 0 0',
            marginTop: '-24px',
            position: 'relative',
            zIndex: 2,
            padding: '24px 26px 24px 26px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -12px 30px rgba(20,26,51,0.06)'
          }}
        >
          {/* TABS */}
          <nav
            style={{
              display: 'flex',
              background: '#F0EDFC',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '20px'
            }}
            aria-label="Choose sign in or create account"
          >
            <button
              type="button"
              style={{
                flex: 1,
                border: 'none',
                background: '#FFFFFF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#181B24',
                padding: '11px 0',
                borderRadius: '9px',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(20,26,51,0.10)'
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRoleChooser();
              }}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: '#767B8A',
                padding: '11px 0',
                borderRadius: '9px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Create account
            </button>
          </nav>

          {successMessage ? (
            <div style={{ textAlign: 'center', padding: '34px 10px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#181B24', margin: 0 }}>
                {successMessage}
              </h3>
              <p style={{ fontSize: '13px', color: '#767B8A', marginTop: '6px' }}>
                Redirecting you...
              </p>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="signin-email"
                  style={{ fontSize: '12.5px', fontWeight: 600, color: '#181B24', letterSpacing: '0.01em' }}
                >
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    id="signin-email"
                    name="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    style={{
                      width: '100%',
                      border: emailError ? '1.4px solid #B3492F' : '1.4px solid #E6E3F7',
                      borderRadius: '11px',
                      background: '#FBFAFE',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                      color: '#181B24',
                      padding: '13px 14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {emailError && (
                  <span style={{ fontSize: '12px', color: '#B3492F' }}>
                    Enter a valid email address.
                  </span>
                )}
              </div>

              {/* Password field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label
                  htmlFor="signin-password"
                  style={{ fontSize: '12.5px', fontWeight: 600, color: '#181B24', letterSpacing: '0.01em' }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="signin-password"
                    name="password"
                    required
                    minLength={8}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(false);
                    }}
                    style={{
                      width: '100%',
                      border: passwordError ? '1.4px solid #B3492F' : '1.4px solid #E6E3F7',
                      borderRadius: '11px',
                      background: '#FBFAFE',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '15px',
                      color: '#181B24',
                      padding: '13px 52px 13px 14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#5B21D6',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {passwordError && (
                  <span style={{ fontSize: '12px', color: '#B3492F' }}>
                    Password must be at least 8 characters.
                  </span>
                )}
              </div>

              {/* Forgot password row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link sent to your registered email.');
                  }}
                  style={{
                    fontSize: '13px',
                    color: '#5B21D6',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Sign in submit button (100% exact match to HTML & screenshot) */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '4px',
                  width: '100%',
                  background: 'linear-gradient(135deg, #1B4FE0 0%, #5B21D6 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '15px 0',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'progress' : 'pointer',
                  boxShadow: '0 8px 20px rgba(27,79,224,0.25)',
                  transition: 'transform .15s ease, box-shadow .2s ease'
                }}
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* DIVIDER (Exact match to HTML & screenshot) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '22px 0 0 0',
              color: '#767B8A',
              fontSize: '12.5px'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#E6E3F7' }} />
            <span>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: '#E6E3F7' }} />
          </div>

          {/* SOCIAL BUTTONS (Exact match to HTML & screenshot) */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '16px 0 0 0'
            }}
            role="group"
            aria-label="Continue with a social account"
          >
            <button
              type="button"
              onClick={() => handleSocialAuth('Google')}
              aria-label="Continue with Google"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 0',
                border: '1.4px solid #E6E3F7',
                background: '#FFFFFF',
                borderRadius: '11px',
                cursor: 'pointer',
                transition: 'border-color .2s ease, box-shadow .2s ease'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleSocialAuth('Apple')}
              aria-label="Continue with Apple"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 0',
                border: '1.4px solid #E6E3F7',
                background: '#FFFFFF',
                borderRadius: '11px',
                cursor: 'pointer',
                transition: 'border-color .2s ease, box-shadow .2s ease'
              }}
            >
              <svg width="14" height="16" viewBox="0 0 16 18" fill="#181B24">
                <path d="M13.1 9.5c0-2.05 1.68-3.03 1.75-3.08-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.65 0-1.63-.73-2.68-.71-1.38.02-2.65.8-3.36 2.04-1.43 2.48-.37 6.16 1.03 8.18.68.98 1.5 2.09 2.57 2.05 1.03-.04 1.42-.67 2.67-.67 1.24 0 1.6.67 2.68.65 1.11-.02 1.82-1.01 2.5-2 .78-1.13 1.1-2.24 1.11-2.3-.02-.01-2.16-.83-2.17-3.29zM11 3.06c.57-.7.96-1.66.85-2.62-.83.03-1.83.55-2.42 1.24-.53.62-.99 1.6-.87 2.53.92.07 1.86-.46 2.44-1.15z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleSocialAuth('Facebook')}
              aria-label="Continue with Facebook"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 0',
                border: '1.4px solid #E6E3F7',
                background: '#FFFFFF',
                borderRadius: '11px',
                cursor: 'pointer',
                transition: 'border-color .2s ease, box-shadow .2s ease'
              }}
            >
              <svg width="17" height="17" viewBox="0 0 18 18">
                <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.4 8.9v-6.3H5.3V9h2.3V7.1c0-2.27 1.35-3.53 3.42-3.53.99 0 2.03.18 2.03.18v2.23h-1.14c-1.13 0-1.48.7-1.48 1.42V9h2.52l-.4 2.6h-2.12v6.3A9 9 0 0 0 18 9z" />
              </svg>
            </button>
          </div>

          {/* TRUST BADGE (Exact match to HTML & screenshot) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '11px 13px',
              background: '#F0EDFC',
              borderRadius: '11px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path fill="#767B8A" d="M8 0 L14 2.5 V7 C14 11 11.5 14 8 16 C4.5 14 2 11 2 7 V2.5 Z" />
            </svg>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#767B8A', lineHeight: 1.5 }}>
              Your details are encrypted and never shared with third parties.
            </p>
          </div>

          {/* FOOTNOTE (Exact match to HTML & screenshot) */}
          <footer
            style={{
              marginTop: '18px',
              padding: '0 0 4px 0',
              textAlign: 'center',
              fontSize: '12.5px',
              color: '#767B8A',
              lineHeight: 1.6
            }}
          >
            New here?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onClose();
                onOpenRoleChooser();
              }}
              style={{
                color: '#181B24',
                fontWeight: 600,
                textDecoration: 'none',
                borderBottom: '1px solid #5B21D6'
              }}
            >
              Create an account
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
