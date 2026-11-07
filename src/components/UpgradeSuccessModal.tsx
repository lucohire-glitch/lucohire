import React, { useState } from 'react';
import { toggleAutoRenewSubscription } from '../api';

interface UpgradeSuccessModalProps {
  isOpen: boolean;
  planName: string;
  amount?: number | string;
  paymentId?: string;
  expiresAt?: string | null;
  initialAutoRenew?: boolean;
  userEmail?: string;
  onClose: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function UpgradeSuccessModal({
  isOpen,
  planName,
  paymentId,
  expiresAt: propExpiresAt,
  initialAutoRenew = true,
  userEmail,
  onClose,
  onContinue,
  continueLabel = 'Continue →',
}: UpgradeSuccessModalProps) {
  const [autoRenew, setAutoRenew] = useState<boolean>(initialAutoRenew);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate default expiration date (30 days from now if not passed)
  const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const activeExpiry = propExpiresAt || defaultExpiry;
  const formattedExpiry = new Date(activeExpiry).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleToggleAutoRenew = async (enable: boolean) => {
    try {
      setIsUpdating(true);
      const res = await toggleAutoRenewSubscription(enable, userEmail);
      setAutoRenew(res.autoRenew);
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update auto-subscription setting');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          maxWidth: '480px',
          width: '100%',
          padding: '32px 26px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          animation: 'fadeInScale 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(22, 163, 74, 0.2)',
          }}
        >
          ✓
        </div>

        <h3
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#0F172A',
            margin: '0 0 8px',
            fontFamily: "'Space Grotesk', 'Fraunces', sans-serif",
          }}
        >
          Plan Activated Successfully!
        </h3>

        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 18px' }}>
          Aapka <b>{planName}</b> plan activate ho chuka hai! Aapke premium features aur benefits ab live hain.
        </p>

        {/* Auto-Renewal Management Box */}
        <div
          style={{
            background: autoRenew ? '#F0FDF4' : '#FFFBEB',
            border: autoRenew ? '1.5px solid #86EFAC' : '1.5px solid #FDE68A',
            borderRadius: '16px',
            padding: '16px 18px',
            textAlign: 'left',
            marginBottom: '20px',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subscription &amp; Renewal
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '999px',
                background: autoRenew ? '#DCFCE7' : '#FEF3C7',
                color: autoRenew ? '#15803D' : '#B45309',
                border: autoRenew ? '1px solid #86EFAC' : '1px solid #FCD34D',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {autoRenew ? '● Auto-Subscription: ON' : '○ Auto-Subscription: OFF'}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#1E293B', lineHeight: '1.45', margin: '0 0 10px' }}>
            {autoRenew ? (
              <>
                Plan expire hone par <b>{formattedExpiry}</b> ko auto-subscription activate rahega taaki aapki profile boost aur leads ruken nahi.
              </>
            ) : (
              <>
                Auto-subscription remove kar diya gaya hai. Aapka plan <b>{formattedExpiry}</b> ko expire ho jayega aur auto-renew nahi hoga.
              </>
            )}
          </p>

          {/* User Option to Remove or Enable Auto-Subscription */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {autoRenew ? 'Auto-renew nahi chahte?' : 'Dobara auto-renew chalu karna hai?'}
            </span>
            {autoRenew ? (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleToggleAutoRenew(false)}
                style={{
                  background: 'none',
                  border: '1px solid #DC2626',
                  color: '#DC2626',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isUpdating ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Cancel auto-renew. Your benefits remain active until expiry."
              >
                {isUpdating ? 'Removing...' : '✕ Remove Auto-Subscription'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleToggleAutoRenew(true)}
                style={{
                  background: '#15803D',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: isUpdating ? 'wait' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title="Turn on auto-subscription so your plan automatically renews on expiry."
              >
                {isUpdating ? 'Enabling...' : '✓ Turn On Auto-Subscription'}
              </button>
            )}
          </div>

          {toastMessage && (
            <div
              style={{
                marginTop: '10px',
                padding: '6px 10px',
                background: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ℹ️ {toastMessage}
            </div>
          )}
        </div>

        {paymentId && (
          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginBottom: '18px' }}>
            Payment ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{paymentId}</span>
          </div>
        )}

        {/* Buttons */}
        <button
          type="button"
          onClick={() => {
            onClose();
            if (onContinue) onContinue();
          }}
          style={{
            width: '100%',
            padding: '13px 20px',
            borderRadius: '12px',
            background: 'var(--brand-700, #4C2FD9)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '14.5px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 18px -4px rgba(76, 47, 217, 0.45)',
            marginBottom: '10px',
            fontFamily: 'inherit',
          }}
        >
          {continueLabel}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '9px',
            borderRadius: '10px',
            background: 'none',
            color: '#64748B',
            fontWeight: 600,
            fontSize: '13px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

