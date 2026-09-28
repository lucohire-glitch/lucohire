/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import LucoLogo from './components/LucoLogo';
import AuthModal from './components/AuthModal';
import RoleChooserModal from './components/RoleChooserModal';
import CandidateRegistration from './components/CandidateRegistration';
import RecruiterRegistration from './components/RecruiterRegistration';
import ProfileHomeScreen from './components/ProfileHomeScreen';
import ResumeCheckView from './components/ResumeCheckView';

const SKILLS = [
  "Logo Design", "React Developer", "Video Editing", "Content Writing", "SEO Expert",
  "UI/UX Designer", "WordPress Developer", "Social Media Marketing", "Voice-over Artist",
  "Data Entry", "App Developer", "Python Developer", "Graphic Designer", "Photographer",
  "Translator", "Virtual Assistant", "Copywriter", "Illustrator", "3D Animator",
  "Digital Marketer", "Video Editor", "Brand Designer", "SaaS Content Writer"
];

const CHK = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PRICING = {
  freelancer: {
    color: 'var(--wa)',
    tint: 'var(--wa-tint)',
    freeAmt: '₹0',
    freeUnit: '/forever',
    free: [
      'Create your full profile',
      'Show up in search & get notified of matching requirements',
      'Accept requirements & message clients',
      'Unlimited applications'
    ],
    premAmt: 'From ₹49',
    premUnit: '/month',
    prem: [
      'Verified badge — ID, payment & portfolio checked',
      'Profile boost — placed above unverified profiles',
      'Priority on new matching requirements'
    ],
    why: '<b>Free</b> gets you listed and matched. <b>Verified + Boosted</b> gets you picked first.',
    social: '2,300+ freelancers already verified or boosted',
    cta: 'Get Verified — from ₹49/month'
  },
  recruiter: {
    color: 'var(--amber)',
    tint: 'var(--amber-tint)',
    freeAmt: '₹0',
    freeUnit: '/forever',
    free: [
      'Post unlimited requirements',
      'Search & browse every profile',
      'Open full profiles, no limit',
      'Message your first 4 freelancers per requirement'
    ],
    premAmt: '₹1,499',
    premUnit: '/month',
    prem: [
      'Unlimited messages to freelancers',
      'AI-shortlisted top 5–6 matches per requirement',
      'Priority support'
    ],
    why: '<b>Free</b> lets you browse everyone. <b>Premium</b> tells you exactly who to message first.',
    social: '1,100+ businesses hiring on LucoHire',
    cta: 'Upgrade ₹1,499/month'
  }
};

export default function App() {
  const [pricingTab, setPricingTab] = useState<'freelancer' | 'recruiter'>('freelancer');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchInputVal, setSearchInputVal] = useState('');
  const [suggestVisible, setSuggestVisible] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Modals & Screen states
  const [isResumeCheckOpen, setIsResumeCheckOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRoleChooserOpen, setIsRoleChooserOpen] = useState(false);
  const [isCandidateRegOpen, setIsCandidateRegOpen] = useState(false);
  const [isRecruiterRegOpen, setIsRecruiterRegOpen] = useState(false);
  const [isProfileHomeOpen, setIsProfileHomeOpen] = useState(false);
  const [candidateData, setCandidateData] = useState<any>(null);

  const searchCardRef = useRef<HTMLDivElement>(null);

  // Sync body scroll when modal is open
  useEffect(() => {
    const isAnyOpen = isAuthOpen || isRoleChooserOpen || isCandidateRegOpen || isRecruiterRegOpen || isProfileHomeOpen;
    document.body.style.overflow = isAnyOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthOpen, isRoleChooserOpen, isCandidateRegOpen, isRecruiterRegOpen, isProfileHomeOpen]);

  // Close suggest on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchCardRef.current && !searchCardRef.current.contains(e.target as Node)) {
        setSuggestVisible(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Hash listener for direct auth navigation
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#signin' || h === '#auth' || h === '#login') {
        setIsAuthOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const performScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 68;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });

      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        // fallback
      }
    }
  };

  const scrollTo = (id: string) => {
    if (isResumeCheckOpen) {
      setIsResumeCheckOpen(false);
      setTimeout(() => {
        performScroll(id);
      }, 80);
      return;
    }
    performScroll(id);
  };

  const highlightMatch = (text: string, val: string) => {
    const idx = text.toLowerCase().indexOf(val.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <b>{text.slice(idx, idx + val.length)}</b>
        {text.slice(idx + val.length)}
      </>
    );
  };

  const getFilteredSkills = () => {
    const val = searchInputVal.trim().toLowerCase();
    if (!val) return SKILLS.slice(0, 7);
    return SKILLS.filter((x) => x.toLowerCase().includes(val)).slice(0, 7);
  };

  const pickSuggest = (item: string) => {
    setSearchInputVal(item);
    setSuggestVisible(false);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentPricing = PRICING[pricingTab];

  // If user clicked "Why am I not getting hired?", open the exact Resume Check HTML view
  if (isResumeCheckOpen) {
    return (
      <>
        <ResumeCheckView
          onBack={() => setIsResumeCheckOpen(false)}
          onGoToFreelancers={() => scrollTo('frlSection')}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            if (window.location.hash === '#signin' || window.location.hash === '#auth') {
              history.replaceState(null, '', ' ');
            }
          }}
          onOpenRoleChooser={() => {
            setIsAuthOpen(false);
            setIsRoleChooserOpen(true);
          }}
        />
        <RoleChooserModal
          isOpen={isRoleChooserOpen}
          onClose={() => setIsRoleChooserOpen(false)}
          onChooseCandidate={() => setIsCandidateRegOpen(true)}
          onChooseRecruiter={() => setIsRecruiterRegOpen(true)}
        />
        <CandidateRegistration
          isOpen={isCandidateRegOpen}
          onClose={() => setIsCandidateRegOpen(false)}
          onComplete={(data: any) => {
            setCandidateData(data);
            setIsCandidateRegOpen(false);
            setIsProfileHomeOpen(true);
          }}
          onSwitchToRecruiter={() => {
            setIsCandidateRegOpen(false);
            setIsRecruiterRegOpen(true);
          }}
        />
        <RecruiterRegistration
          isOpen={isRecruiterRegOpen}
          onClose={() => setIsRecruiterRegOpen(false)}
          onComplete={(data: any) => {
            setIsRecruiterRegOpen(false);
            alert(`Account created for ${data.name || 'Recruiter'} (${data.company || 'Company'})!`);
          }}
          onSwitchToCandidate={() => {
            setIsRecruiterRegOpen(false);
            setIsCandidateRegOpen(true);
          }}
        />
        <ProfileHomeScreen
          isOpen={isProfileHomeOpen}
          onClose={() => setIsProfileHomeOpen(false)}
          score={80}
          userData={candidateData || {}}
          onEditSection={() => {
            setIsProfileHomeOpen(false);
            setIsCandidateRegOpen(true);
          }}
        />
      </>
    );
  }

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <button className="icon-btn" aria-label="Freelancers on LucoHire" title="Freelancers on LucoHire" onClick={() => scrollTo('frlSection')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', flexShrink: 0 }}>
            <LucoLogo size={20} />
          </div>
          <div>
            <span className="luco">Luco</span>
            <span className="hire">Hire</span>
          </div>
        </div>
        <button className="icon-btn" aria-label="Account" onClick={() => setIsAuthOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </button>
      </header>

      {/* HERO — clean, minimal, two clear paths */}
      <section className="hero">
        <h1>
          Your Next Job.<br />
          Or Your Next <span className="accent">Client.</span>
        </h1>
        <p className="sub">Resume check for job seekers. Free listing for freelancers. One platform, both sides.</p>
        <div className="hero-btns">
          <button className="hero-btn primary" id="findFreelancerBtn" onClick={() => scrollTo('frlSection')}>
            Find Freelancer
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className="hero-btn secondary" id="resumeCta" onClick={() => setIsResumeCheckOpen(true)}>
            Why am I not getting hired?
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </section>

      {/* YOUR PATH TO JOB-READY */}
      <div className="path2-section" id="oneFlowSection">
        <span className="path2-badge">
          <span className="dot"></span>
          YOUR PATH TO JOB-READY
        </span>
        <h3 className="path2-title">One flow, start to finish.</h3>
        <p className="path2-lead">So you're not jumping across 5 apps just to prep for one job.</p>

        <div className="path2-list">
          <div className="path2-step">
            <div className="path2-num">1</div>
            <div className="path2-body">
              <h4>Check karo and batao</h4>
              <p>We compare the job to your profile and name the exact gaps — not a generic syllabus everyone gets.</p>
            </div>
          </div>
          <div className="path2-step active">
            <div className="path2-num">2</div>
            <div className="path2-body">
              <h4>Padhaao <span className="path2-pill">IN PROGRESS</span></h4>
              <p>Bite-sized lessons on just those gaps — SQL joins, System Design basics, whatever's actually missing.</p>
            </div>
          </div>
          <div className="path2-step">
            <div className="path2-num">3</div>
            <div className="path2-body">
              <h4>Practice karao</h4>
              <p>Real interview-style questions and scenarios, not flashcards — until it actually sticks.</p>
            </div>
          </div>
          <div className="path2-step">
            <div className="path2-num">4</div>
            <div className="path2-body">
              <h4>Test karo</h4>
              <p>A timed test built like what recruiters actually screen for — no guessing your own score.</p>
            </div>
          </div>
          <div className="path2-step">
            <div className="path2-num">5</div>
            <div className="path2-body">
              <h4>Bata do — ready hoon ya nahi</h4>
              <p>One straight verdict: job-ready, or exactly what's left before you can say yes.</p>
            </div>
          </div>
        </div>

        <div className="path2-progress">
          <div className="path2-target">🎯</div>
          <p>Example: a Senior UX Designer candidate reaches <b>68% ready</b> after Padhaao — 2 topics left before "go apply."</p>
          <div className="path2-bar"><span style={{ width: '68%' }}></span></div>
        </div>

        <button
          className="hero-btn primary"
          style={{ marginTop: '18px' }}
          onClick={() => setIsResumeCheckOpen(true)}
        >
          Start My Resume Check
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="divider">
        <div className="line"></div>
        <div className="dot"></div>
        <div className="line rev"></div>
      </div>

      {/* FREELANCER CARDS */}
      <div className="frl-section" id="frlSection">
        <div className="frl-head">
          <h3>Freelancers on LucoHire</h3>
          <span className="frl-count">6,200+ live</span>
        </div>
        <div className="frl-filter-row" id="frlFilterRow">
          {[
            { key: 'all', label: 'All' },
            { key: 'design', label: 'Design' },
            { key: 'dev', label: 'Development' },
            { key: 'content', label: 'Content' },
            { key: 'video', label: 'Video & Audio' },
            { key: 'marketing', label: 'Marketing' }
          ].map((chip) => (
            <button
              key={chip.key}
              className={`frl-filter-chip ${activeFilter === chip.key ? 'on' : ''}`}
              data-f={chip.key}
              onClick={() => setActiveFilter(chip.key)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="frl-grid">
          {/* Card 1 — boosted */}
          <div className="frl-wrap">
            <div className="frl-boost-tag">⚡ Boosted profile • Responds fast</div>
            <div className="frl-card">
              <div className="frl-top">
                <div className="frl-photo-wrap">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Ananya Verma" />
                  <span className="frl-online"></span>
                </div>
                <div className="frl-info">
                  <div className="frl-name-row">
                    <div className="frl-name">Ananya Verma</div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#4A3AE0" />
                      <path d="M6 10.2l2.4 2.4L14 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="frl-role">SaaS Content Writer</div>
                  <div className="frl-loc-row">📍 Pune • Remote</div>
                </div>
                <div className="frl-rating-col">
                  <div className="frl-rating"><span>★</span> 4.9</div>
                  <div className="frl-rating-lbl">120 jobs</div>
                </div>
              </div>

              <div className="frl-meta-row">
                <div className="frl-meta-col">
                  <div className="frl-meta-num">3+ Yrs</div>
                  <div className="frl-meta-lbl">Experience</div>
                </div>
                <div className="frl-meta-col">
                  <div className="frl-meta-num">100%</div>
                  <div className="frl-meta-lbl">Response rate</div>
                </div>
                <div className="frl-meta-col">
                  <div className="frl-meta-num">Today</div>
                  <div className="frl-meta-lbl">Can start</div>
                </div>
              </div>

              <div className="skills-row frl-skills">
                <span className="frl-chip">SaaS Copy</span>
                <span className="frl-chip">SEO Writing</span>
                <span className="frl-chip">Notion</span>
              </div>

              <div className="frl-boxes">
                <div className="frl-box">
                  <div className="big">₹4<span>/word</span></div>
                  <div className="box-lbl">Starting rate</div>
                </div>
                <div className="frl-box avail">
                  <div className="big">3 slots<span>open</span></div>
                  <div className="box-lbl">This month</div>
                </div>
              </div>

              <div className="frl-verify-row">
                <div className="frl-verify-item">✓ ID Verified</div>
                <div className="frl-verify-item">✓ Portfolio Verified</div>
                <div className="frl-verify-item">✓ Payment Verified</div>
              </div>

              <div className="frl-actions-row">
                <button className="frl-btn-outline">View Profile</button>
                <button className="frl-btn-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Message
                </button>
                <button
                  className="frl-btn-heart"
                  onClick={() => toggleFavorite('f1')}
                  style={{ color: favorites['f1'] ? '#E11D48' : 'var(--ink-soft)' }}
                >
                  {favorites['f1'] ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="frl-wrap">
            <div className="frl-card">
              <div className="frl-top">
                <div className="frl-photo-wrap">
                  <img src="https://randomuser.me/api/portraits/men/52.jpg" alt="Rohit Malhotra" />
                  <span className="frl-online"></span>
                </div>
                <div className="frl-info">
                  <div className="frl-name-row">
                    <div className="frl-name">Rohit Malhotra</div>
                  </div>
                  <div className="frl-role">Voice-over &amp; Audio Editor</div>
                  <div className="frl-loc-row">📍 Lucknow • Remote</div>
                </div>
                <div className="frl-rating-col">
                  <div className="frl-rating"><span>★</span> 4.8</div>
                  <div className="frl-rating-lbl">80 jobs</div>
                </div>
              </div>

              <div className="frl-meta-row">
                <div className="frl-meta-col">
                  <div className="frl-meta-num">5+ Yrs</div>
                  <div className="frl-meta-lbl">Experience</div>
                </div>
                <div className="frl-meta-col">
                  <div className="frl-meta-num">95%</div>
                  <div className="frl-meta-lbl">Response rate</div>
                </div>
                <div className="frl-meta-col">
                  <div className="frl-meta-num">Tomorrow</div>
                  <div className="frl-meta-lbl">Can start</div>
                </div>
              </div>

              <div className="skills-row frl-skills">
                <span className="frl-chip">Voice-over</span>
                <span className="frl-chip">Audio Editing</span>
                <span className="frl-chip">Hindi + English</span>
              </div>

              <div className="frl-boxes">
                <div className="frl-box">
                  <div className="big">₹2,500<span>/project</span></div>
                  <div className="box-lbl">Starting rate</div>
                </div>
                <div className="frl-box avail">
                  <div className="big">5 slots<span>open</span></div>
                  <div className="box-lbl">This month</div>
                </div>
              </div>

              <div className="frl-verify-row">
                <div className="frl-verify-item">✓ ID Verified</div>
                <div className="frl-verify-item">✓ Portfolio Verified</div>
              </div>

              <div className="frl-actions-row">
                <button className="frl-btn-outline">View Profile</button>
                <button className="frl-btn-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Message
                </button>
                <button
                  className="frl-btn-heart"
                  onClick={() => toggleFavorite('f2')}
                  style={{ color: favorites['f2'] ? '#E11D48' : 'var(--ink-soft)' }}
                >
                  {favorites['f2'] ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="frl-wrap">
            <div className="frl-card">
              <div className="frl-top">
                <div className="frl-photo-wrap">
                  <img src="https://randomuser.me/api/portraits/women/54.jpg" alt="Meher Kaur" />
                  <span className="frl-online"></span>
                </div>
                <div className="frl-info">
                  <div className="frl-name-row">
                    <div className="frl-name">Meher Kaur</div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#4A3AE0" />
                      <path d="M6 10.2l2.4 2.4L14 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="frl-role">Logo &amp; Brand Designer</div>
                  <div className="frl-loc-row">📍 Delhi • Remote</div>
                </div>
                <div className="frl-rating-col">
                  <div className="frl-rating"><span>★</span> 5.0</div>
                  <div className="frl-rating-lbl">150 jobs</div>
                </div>
              </div>

              <div className="frl-meta-row">
                <div className="frl-meta-col">
                  <div className="frl-meta-num">4+ Yrs</div>
                  <div className="frl-meta-lbl">Experience</div>
                </div>
                <div className="frl-meta-col">
                  <div className="frl-meta-num">98%</div>
                  <div className="frl-meta-lbl">Response rate</div>
                </div>
                <div className="frl-meta-col">
                  <div className="frl-meta-num">Today</div>
                  <div className="frl-meta-lbl">Can start</div>
                </div>
              </div>

              <div className="skills-row frl-skills">
                <span className="frl-chip">Figma</span>
                <span className="frl-chip">Branding</span>
                <span className="frl-chip">Illustration</span>
              </div>

              <div className="frl-boxes">
                <div className="frl-box">
                  <div className="big">₹3,000<span>/logo</span></div>
                  <div className="box-lbl">Starting rate</div>
                </div>
                <div className="frl-box avail">
                  <div className="big">2 slots<span>open</span></div>
                  <div className="box-lbl">This month</div>
                </div>
              </div>

              <div className="frl-verify-row">
                <div className="frl-verify-item">✓ ID Verified</div>
                <div className="frl-verify-item">✓ Portfolio Verified</div>
                <div className="frl-verify-item">✓ Payment Verified</div>
              </div>

              <div className="frl-actions-row">
                <button className="frl-btn-outline">View Profile</button>
                <button className="frl-btn-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Message
                </button>
                <button
                  className="frl-btn-heart"
                  onClick={() => toggleFavorite('f3')}
                  style={{ color: favorites['f3'] ? '#E11D48' : 'var(--ink-soft)' }}
                >
                  {favorites['f3'] ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          </div>

          {/* View more */}
          <div className="frl-more-card">
            <div className="n">+6,197</div>
            <div className="t">More freelancers waiting</div>
            <div className="d">Browse everyone, filtered by skill, rate, rating or location.</div>
            <button onClick={() => scrollTo('frlSection')}>View All Freelancers →</button>
          </div>
        </div>
      </div>

      <div className="divider">
        <div className="line"></div>
        <div className="dot"></div>
        <div className="line rev"></div>
      </div>

      {/* HOW LUCOHIRE WORKS — FOR FREELANCERS & RECRUITERS */}
      <div className="persona-section">
        <p className="eyebrow">How LucoHire Works</p>
        <h3 style={{ fontSize: '19px' }}>One platform. Two sides. Real work, done fast.</h3>
        <p style={{ fontSize: '12.5px', color: 'var(--ink-soft)', marginTop: '6px', lineHeight: 1.55 }}>
          Whether you're here to hire freelancers online or find freelance jobs that pay — here's what you get.
        </p>

        <div className="persona-grid">
          <div className="persona-card seeker">
            <span className="persona-tag">FOR JOB SEEKERS</span>
            <h3>Free resume check, then a clear plan to get job-ready.</h3>
            <p>No more guessing why applications go unanswered. See your gaps, close them, and track your readiness for the role you actually want.</p>
            <div className="persona-list">
              <div className="persona-item"><span className="ic">✓</span>Instant ATS score with a fix-it list, not vague feedback</div>
              <div className="persona-item"><span className="ic">✓</span>A 5-step guided path: Batao → Padhaao → Practice → Test → Bata do</div>
              <div className="persona-item"><span className="ic">✓</span>List your skills too, and pick up freelance work while you search</div>
            </div>
            <button className="persona-cta" onClick={() => setIsResumeCheckOpen(true)}>Check My Resume — Free →</button>
          </div>

          <div className="persona-card freelancer">
            <span className="persona-tag">FOR FREELANCERS</span>
            <h3>Find freelance jobs online and get hired faster.</h3>
            <p>Create your free profile, get discovered by verified clients, and start earning from home — no bidding wars, no fee to apply.</p>
            <div className="persona-list">
              <div className="persona-item"><span className="ic">✓</span>Get notified the instant a client posts work matching your skill</div>
              <div className="persona-item"><span className="ic">✓</span>A verified profile ranks higher and gets picked first</div>
              <div className="persona-item"><span className="ic">✓</span>List every skill you freelance in — design, writing, dev, more</div>
            </div>
            <button className="persona-cta" onClick={() => setIsCandidateRegOpen(true)}>Register as a Freelancer →</button>
          </div>

          <div className="persona-card recruiter">
            <span className="persona-tag">FOR CLIENTS &amp; RECRUITERS</span>
            <h3>Hire freelancers online — fast, free and verified.</h3>
            <p>Post a job for free and get matched with ID-verified freelancers across design, development, content, video and marketing.</p>
            <div className="persona-list">
              <div className="persona-item"><span className="ic">✓</span>Message your first <b style={{ color: 'var(--green)' }}>4 freelancers</b> free on any requirement</div>
              <div className="persona-item"><span className="ic">✓</span>Every matching freelancer is notified the moment you post</div>
              <div className="persona-item"><span className="ic">✓</span>Too many applicants? Let us shortlist the top 5–6 for you</div>
            </div>
            <button className="persona-cta" onClick={() => setIsRecruiterRegOpen(true)}>Post Your Requirement — Free</button>
          </div>
        </div>
      </div>

      <div className="divider">
        <div className="line"></div>
        <div className="dot"></div>
        <div className="line rev"></div>
      </div>

      {/* PRICING */}
      <div className="pricing-section">
        <p className="eyebrow">Free vs Paid</p>
        <h3 style={{ fontSize: '19px' }}>What's free, and what's worth paying for</h3>

        <div className="price-tabs" id="priceTabs">
          <div
            className={`price-tab ${pricingTab === 'freelancer' ? 'active' : ''}`}
            data-c="freelancer"
            onClick={() => setPricingTab('freelancer')}
          >
            Freelancer
          </div>
          <div
            className={`price-tab ${pricingTab === 'recruiter' ? 'active' : ''}`}
            data-c="recruiter"
            onClick={() => setPricingTab('recruiter')}
          >
            Recruiter / Client
          </div>
        </div>

        <div className="price-card" id="price-card">
          <div className="price-cols">
            <div className="price-col free">
              <div className="price-col-lbl">Free</div>
              <div className="price-amt">
                {currentPricing.freeAmt}
                <span>{currentPricing.freeUnit}</span>
              </div>
              {currentPricing.free.map((feat) => (
                <div className="price-feat" key={feat} style={{ color: 'var(--green)' }}>
                  {CHK}
                  <span style={{ color: 'var(--ink-soft)' }}>{feat}</span>
                </div>
              ))}
            </div>
            <div className="price-col premium" style={{ background: currentPricing.tint }}>
              <div className="premium-badge">WORTH IT</div>
              <div className="price-col-lbl" style={{ color: currentPricing.color }}>Paid</div>
              <div className="price-amt" style={{ color: currentPricing.color }}>
                {currentPricing.premAmt}
                <span style={{ color: currentPricing.color, opacity: 0.7 }}>{currentPricing.premUnit}</span>
              </div>
              {currentPricing.prem.map((feat) => (
                <div className="price-feat" key={feat} style={{ color: currentPricing.color }}>
                  {CHK}
                  <span style={{ color: 'var(--ink-soft)' }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="price-why" dangerouslySetInnerHTML={{ __html: currentPricing.why }} />
          <div className="price-social">
            <div className="avatars">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {currentPricing.social}
          </div>
          <div className="price-cta-row">
            <button
              className="price-cta"
              style={{ background: currentPricing.color }}
              onClick={() => {
                if (pricingTab === 'freelancer') {
                  setIsCandidateRegOpen(true);
                } else {
                  setIsRecruiterRegOpen(true);
                }
              }}
            >
              {currentPricing.cta}
            </button>
          </div>
        </div>
      </div>

      <div className="divider">
        <div className="line"></div>
        <div className="dot"></div>
        <div className="line rev"></div>
      </div>

      {/* TRUST */}
      <div className="trust-section">
        <p className="eyebrow">Why LucoHire</p>
        <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Built so both sides show up serious</h3>
        <div className="trust-row">
          <div className="trust-item"><div className="ti-num">98%</div><div className="ti-lbl">Requirements get a response</div></div>
          <div className="trust-item"><div className="ti-num">~12 min</div><div className="ti-lbl">Avg. freelancer response time</div></div>
          <div className="trust-item"><div className="ti-num">4.7 ★</div><div className="ti-lbl">Avg. freelancer rating</div></div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', flexShrink: 0 }}>
            <LucoLogo size={20} />
          </div>
          <div>
            <span className="luco">Luco</span>
            <span className="hire" style={{ color: 'var(--gold)' }}>Hire</span>
          </div>
        </div>
        <p className="ftag">
          India's AI-assisted freelance marketplace to hire verified freelancers online and find freelance jobs that actually pay — fair distribution, WhatsApp-first support.
        </p>

        <div className="footer-social">
          <a href="#facebook" aria-label="Facebook" onClick={(e) => e.preventDefault()}>f</a>
          <a href="#twitter" aria-label="Twitter" onClick={(e) => e.preventDefault()}>𝕏</a>
          <a href="#linkedin" aria-label="LinkedIn" onClick={(e) => e.preventDefault()}>in</a>
          <a href="#instagram" aria-label="Instagram" onClick={(e) => e.preventDefault()}>📷</a>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h5>For Freelancers</h5>
            <a href="#jobs" onClick={(e) => { e.preventDefault(); setIsCandidateRegOpen(true); }}>Find Freelance Jobs</a>
            <a href="#profile" onClick={(e) => { e.preventDefault(); setIsCandidateRegOpen(true); }}>Create Your Profile</a>
            <a href="#tips" onClick={(e) => e.preventDefault()}>Freelancing Tips</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); setPricingTab('freelancer'); scrollTo('priceTabs'); }}>Pricing</a>
            <a href="#help" onClick={(e) => e.preventDefault()}>Help Center</a>
          </div>
          <div className="footer-col">
            <h5>For Clients &amp; Recruiters</h5>
            <a href="#post" onClick={(e) => { e.preventDefault(); setIsRecruiterRegOpen(true); }}>Post a Requirement</a>
            <a href="#find" onClick={(e) => { e.preventDefault(); scrollTo('frlSection'); }}>Find Freelancers</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); setPricingTab('recruiter'); scrollTo('priceTabs'); }}>Pricing</a>
            <a href="#resources" onClick={(e) => e.preventDefault()}>Resources</a>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <a href="#about" onClick={(e) => e.preventDefault()}>About Us</a>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a>
            <a href="#contact" onClick={(e) => e.preventDefault()}>Contact Us</a>
            <a href="#refund" onClick={(e) => e.preventDefault()}>Refund Policy</a>
          </div>
        </div>

        <div className="footer-news">
          <h5>Stay Updated</h5>
          <p>Freelance job alerts &amp; platform news — once a month.</p>
          {newsletterSubscribed ? (
            <p style={{ color: '#8CF0C2', fontWeight: 600, fontSize: '13px' }}>
              ✓ Subscribed! You will receive freelance job alerts.
            </p>
          ) : (
            <form
              className="footer-news-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail.trim()) {
                  setNewsletterSubscribed(true);
                }
              }}
            >
              <input
                type="email"
                placeholder="you@email.com"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button type="submit">Subscribe →</button>
            </form>
          )}
        </div>

        <div className="bottom">
          <span>© 2026 LucoHire. All rights reserved.</span>
          <span className="secure">🔒 Secure &amp; verified</span>
        </div>
      </footer>

      {/* AUTH & REGISTRATION MODALS (Linked to account & user actions) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenRoleChooser={() => setIsRoleChooserOpen(true)}
      />

      <RoleChooserModal
        isOpen={isRoleChooserOpen}
        onClose={() => setIsRoleChooserOpen(false)}
        onChooseCandidate={() => setIsCandidateRegOpen(true)}
        onChooseRecruiter={() => setIsRecruiterRegOpen(true)}
      />

      <CandidateRegistration
        isOpen={isCandidateRegOpen}
        onClose={() => setIsCandidateRegOpen(false)}
        onComplete={(data: any) => {
          setCandidateData(data);
          setIsCandidateRegOpen(false);
          setIsProfileHomeOpen(true);
        }}
        onSwitchToRecruiter={() => {
          setIsCandidateRegOpen(false);
          setIsRecruiterRegOpen(true);
        }}
      />

      <RecruiterRegistration
        isOpen={isRecruiterRegOpen}
        onClose={() => setIsRecruiterRegOpen(false)}
        onComplete={(data: any) => {
          setIsRecruiterRegOpen(false);
          alert(`Account created for ${data.name || 'Recruiter'} (${data.company || 'Company'})!`);
        }}
        onSwitchToCandidate={() => {
          setIsRecruiterRegOpen(false);
          setIsCandidateRegOpen(true);
        }}
      />

      <ProfileHomeScreen
        isOpen={isProfileHomeOpen}
        onClose={() => setIsProfileHomeOpen(false)}
        score={80}
        userData={candidateData || {}}
        onEditSection={() => {
          setIsProfileHomeOpen(false);
          setIsCandidateRegOpen(true);
        }}
      />
    </div>
  );
}
