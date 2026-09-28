/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface ProfileHomeScreenProps {
  isOpen: boolean;
  score: number;
  userData: any;
  onClose: () => void;
  onEditSection: (step: number) => void;
}

export default function ProfileHomeScreen({
  isOpen,
  score,
  userData,
  onClose,
  onEditSection
}: ProfileHomeScreenProps) {
  const [showDoneList, setShowDoneList] = useState(false);

  if (!isOpen) return null;

  const phGroups = [
    { label: 'Basic profile', hint: 'Name, title, category & location', step: 1, icon: '👤', pts: 14, isDone: true },
    { label: 'Verify mobile & email', hint: 'Builds trust with clients', step: 1, icon: '📱', pts: 14, isDone: true },
    { label: 'Profile picture', hint: 'Profiles with a photo get 3x more views', step: 1, icon: '📷', pts: 5, isDone: false },
    { label: 'Skills & pricing', hint: 'Add at least one priced skill', step: 2, icon: '⚡', pts: 20, isDone: true },
    { label: 'Professional proof', hint: 'About, education/work, links & resume', step: 3, icon: '🎓', pts: 30, isDone: false },
    { label: 'Get a verified badge', hint: 'Aadhaar / PAN — 3x more calls', step: 4, icon: '🛡️', pts: 8, amber: true, isDone: false },
    { label: 'Voice or video intro', hint: 'Clients reply 40% more often', step: 4, icon: '🎙️', pts: 8, amber: true, isDone: false },
    { label: 'Work preferences', hint: 'Languages, availability & duration', step: 4, icon: '⏱️', pts: 12, isDone: true }
  ];

  const pending = phGroups.filter((g) => !g.isDone);
  const done = phGroups.filter((g) => g.isDone);

  const getHeadline = () => {
    if (score >= 100) return 'Your profile is complete';
    if (score >= 70) return 'Featured-ready';
    if (score >= 40) return "You're live in search";
    return 'Almost visible to clients';
  };

  const getSub = () => {
    if (score >= 100) return "You're fully visible and eligible for featured placement.";
    if (score >= 70) return "A few more details and you'll qualify for featured placement.";
    if (score >= 40) return 'Keep going — more sections mean more matches from clients.';
    return `You're ${Math.max(0, 40 - score)}% away from appearing in client search.`;
  };

  return (
    <div id="profileHomeScreen">
      <div className="ph-shell">
        <button
          className="reg-close"
          onClick={onClose}
          aria-label="Close"
          style={{ top: '16px', right: '16px' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <p className="ph-eyebrow">Your profile</p>
        <h1>Profile strength</h1>

        <div className="strength-card">
          <div className="ring" id="phRing" style={{ '--pct': score } as any}>
            <span id="phRingNum">{score}<small>%</small></span>
          </div>
          <div className="strength-txt">
            <h2 id="phHeadline">{getHeadline()}</h2>
            <p id="phSub">{getSub()}</p>
          </div>
        </div>

        <div className="milestones" id="phMilestones">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className={`ms ${score >= i * 10 ? 'on' : ''}`} />
          ))}
        </div>
        <div className="ms-labels">
          <span>0</span>
          <span>40 — listed</span>
          <span>100 — featured</span>
        </div>

        <div className="section-head">
          <h3>Finish these next</h3>
          <span id="phLeftCount">{pending.length} left</span>
        </div>

        <div id="phPendingList">
          {pending.map((g, idx) => (
            <div key={idx} className="ph-item" onClick={() => onEditSection(g.step)}>
              <div className={`ic ${g.amber ? 'amber-ic' : ''}`}>{g.icon}</div>
              <div className="body">
                <b>{g.label}</b>
                <small>{g.hint}</small>
              </div>
              <div className="pts">+{g.pts}%</div>
              <div className="chev">→</div>
            </div>
          ))}
        </div>

        <button
          className={`done-toggle ${showDoneList ? 'open' : ''}`}
          id="phDoneToggle"
          type="button"
          onClick={() => setShowDoneList(!showDoneList)}
        >
          <span className="tick">✓</span>
          <span id="phDoneCount">{done.length} steps already completed</span>
          <span className="arrow">{showDoneList ? '▲' : '▼'}</span>
        </button>

        <div className={`done-list ${showDoneList ? 'open' : ''}`} id="phDoneList">
          {done.map((g, idx) => (
            <div key={idx} className="done-row">
              <span className="tick">✓</span>
              <s>{g.label}</s>
              <span className="pts">+{g.pts}%</span>
            </div>
          ))}
        </div>

        <div className="ph-or">or import from LinkedIn</div>

        <button
          className="linkedin-btn"
          type="button"
          onClick={() => alert('Connect LinkedIn OAuth here to autofill this profile.')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.26 2.37 4.26 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
          </svg>
          Autofill with LinkedIn
        </button>
      </div>

      <div className="ph-cta-wrap">
        <button
          className={`ph-cta ${score >= 40 ? 'ready' : 'primary'}`}
          id="phCta"
          type="button"
          onClick={onClose}
        >
          {pending.length ? `Complete ${pending[0].label.toLowerCase()} →` : 'View your live profile'}
        </button>
        <p className="ph-cta-note" id="phCtaNote">
          {score >= 40
            ? "You're already visible — keep going for featured placement."
            : 'Reach 40% to make your profile visible to clients'}
        </p>
      </div>
    </div>
  );
}
