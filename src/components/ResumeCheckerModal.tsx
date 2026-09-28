/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface ResumeCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterFreelancer: () => void;
}

export default function ResumeCheckerModal({
  isOpen,
  onClose,
  onRegisterFreelancer
}: ResumeCheckerModalProps) {
  const [role, setRole] = useState('React Developer');
  const [resumeText, setResumeText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScannedResult({
        score: 72,
        targetRole: role,
        foundKeywords: ['React.js', 'TypeScript', 'Tailwind CSS', 'Git', 'REST APIs', 'Redux Toolkit'],
        missingKeywords: ['Next.js App Router', 'Server Components (RSC)', 'Jest / React Testing Library', 'CI/CD Pipelines', 'Docker Basics'],
        strengths: [
          'Strong frontend architecture background with modern component patterns',
          'Clear quantification of project impact and performance gains',
          'Well-formatted contact information and GitHub portfolio links'
        ],
        gaps: [
          'Lacks explicit mention of unit testing and end-to-end testing frameworks',
          'Missing full-stack Next.js or SSR experience demanded by current recruiters',
          'Could highlight team mentoring or agile sprint leadership'
        ],
        recommendation: 'You are 72% job-ready for mid-level roles! Complete the missing Next.js & Testing modules to cross the 85% interview guarantee threshold.'
      });
    }, 1000);
  };

  const handleSampleResume = () => {
    setRole('React & Frontend Developer');
    setResumeText(
      `RAHUL VERMA
Frontend Developer | 3+ Years Experience
Email: rahul.v@example.com | Phone: +91 98765 43210 | Portfolio: github.com/rahul-dev

SUMMARY:
Passionate Frontend Engineer with 3 years building responsive web applications using React, TypeScript, and modern CSS frameworks. Reduced bounce rates by 22% and accelerated page loads by 35% across client projects.

EXPERIENCE:
Software Engineer – TechCorp India (2023 - Present)
• Built scalable single-page apps using React 18, TypeScript, and Redux Toolkit.
• Styled high-performance responsive interfaces using Tailwind CSS and CSS Modules.
• Collaborated with backend engineers to integrate complex REST APIs.

Junior Developer – WebStudio Labs (2021 - 2023)
• Developed responsive websites and e-commerce portals using JavaScript and HTML5/CSS3.
• Optimized SEO, cross-browser compatibility, and mobile responsiveness.

EDUCATION:
B.Tech in Computer Science – AKTU (2017 - 2021)

SKILLS:
React, JavaScript (ES6+), TypeScript, Tailwind CSS, HTML/CSS, Git, REST APIs, Figma`
    );
  };

  return (
    <div className="auth-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="screen" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="auth-close" onClick={onClose} aria-label="Close">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <header className="hero-auth" style={{ paddingBottom: '16px' }}>
          <div className="brand">
            <span className="brand-mark">L</span>
            <span className="brand-name">LucoHire Scanner</span>
          </div>
          <h1 style={{ fontSize: '20px' }}>Free ATS Resume Scanner</h1>
          <p>Find out why your applications go unanswered and get a personalized 5-step fix.</p>
        </header>

        <div style={{ padding: '0 20px 24px' }}>
          {!scannedResult ? (
            <form onSubmit={handleScan}>
              <div className="field">
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                  Target Job Role
                </label>
                <div className="input-wrap">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. React Developer, UI/UX Designer, Content Writer"
                    required
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                    Paste Resume Content (or paste LinkedIn / Experience)
                  </label>
                  <button
                    type="button"
                    onClick={handleSampleResume}
                    style={{ fontSize: '11.5px', color: 'var(--violet-700)', fontWeight: 600 }}
                  >
                    Use Sample Resume
                  </button>
                </div>
                <div className="input-wrap">
                  <textarea
                    rows={8}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here (summary, skills, work experience)..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid var(--line)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submit"
                disabled={isScanning}
                style={{
                  marginTop: '18px',
                  background: 'var(--violet-700)',
                  color: '#fff',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '15px'
                }}
              >
                {isScanning ? 'Analyzing ATS Match...' : 'Scan My Resume — 100% Free'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--ink-soft)', marginTop: '10px' }}>
                Your data is processed securely and never shared with external recruiters without permission.
              </p>
            </form>
          ) : (
            <div>
              {/* ATS SCORE CARD */}
              <div
                style={{
                  background: 'var(--lavender-50)',
                  borderRadius: '18px',
                  border: '1.5px solid var(--violet-200)',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--violet-700)' }}>
                  ATS Match Score for {scannedResult.targetRole}
                </div>
                <div style={{ fontSize: '46px', fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--violet-700)', margin: '8px 0' }}>
                  {scannedResult.score}<span style={{ fontSize: '20px', opacity: 0.7 }}>%</span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '99px',
                    background: 'var(--violet-200)',
                    overflow: 'hidden',
                    margin: '0 auto 12px',
                    maxWidth: '240px'
                  }}
                >
                  <div
                    style={{
                      width: `${scannedResult.score}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--violet-700), var(--wa))',
                      borderRadius: '99px'
                    }}
                  />
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  {scannedResult.recommendation}
                </p>
              </div>

              {/* MISSING KEYWORDS */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                  Critical Missing Keywords (Add these to pass ATS):
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {scannedResult.missingKeywords.map((kw: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        background: 'var(--red-tint)',
                        color: 'var(--red)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '99px',
                        border: '1px solid rgba(192, 57, 43, 0.2)'
                      }}
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* FOUND KEYWORDS */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                  Matched Skills &amp; Keywords:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {scannedResult.foundKeywords.map((kw: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        background: 'var(--green-tint)',
                        color: 'var(--green)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '99px'
                      }}
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* RECOMMENDED 5-STEP ACTION PLAN */}
              <div style={{ background: '#fff', border: '1.5px solid var(--line)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--violet-700)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Your 5-Step Roadmap to 100% Ready
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.6 }}>
                  1. <b>Batao:</b> Insert missing keyword bullet points under your latest job.<br />
                  2. <b>Padhaao:</b> Review 15-minute quick primers on Next.js &amp; Testing.<br />
                  3. <b>Practice:</b> Solve 3 targeted interview scenario problems.<br />
                  4. <b>Test:</b> Take LucoHire's 10-minute skill verification quiz.<br />
                  5. <b>Bata do:</b> Unlock your <b>Verified Freelancer Badge</b> and start earning while applying!
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    background: 'var(--violet-700)',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                  onClick={() => {
                    onClose();
                    onRegisterFreelancer();
                  }}
                >
                  List My Skills on LucoHire — Free →
                </button>
                <button
                  type="button"
                  style={{
                    background: 'var(--lavender-50)',
                    color: 'var(--ink)',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '13px',
                    textAlign: 'center'
                  }}
                  onClick={() => setScannedResult(null)}
                >
                  Scan Another Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
