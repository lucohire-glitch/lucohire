/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface RoleChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseCandidate: () => void;
  onChooseRecruiter: () => void;
}

export default function RoleChooserModal({
  isOpen,
  onClose,
  onChooseCandidate,
  onChooseRecruiter
}: RoleChooserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="rc-screen" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="rc-close" onClick={onClose} aria-label="Close">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="rc-wrap">
        <p className="rc-eyebrow">Get started</p>
        <h1 className="rc-title">What brings you to LucoHire?</h1>
        <p className="rc-sub">Pick one — you can always switch later.</p>

        <button
          className="rc-card"
          type="button"
          onClick={() => {
            onClose();
            onChooseCandidate();
          }}
        >
          <span className="rc-card-ic">💼</span>
          <span className="rc-card-body">
            <b>I'm looking for work</b>
            <small>Build a free profile, get matched to jobs &amp; gigs, apply over WhatsApp.</small>
          </span>
          <span className="rc-card-arrow">→</span>
        </button>

        <button
          className="rc-card recruiter"
          type="button"
          onClick={() => {
            onClose();
            onChooseRecruiter();
          }}
        >
          <span className="rc-card-ic">🏢</span>
          <span className="rc-card-body">
            <b>I'm hiring</b>
            <small>Post jobs free, get a Verified Employer badge, shortlist faster.</small>
          </span>
          <span className="rc-card-arrow">→</span>
        </button>
      </div>
    </div>
  );
}
