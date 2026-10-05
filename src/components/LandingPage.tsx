import React, { useState, useEffect } from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onOpenResumeCheck: () => void;
  onOpenRoleChooser: () => void;
  onOpenFreelancerSearch: () => void;
}

export default function LandingPage({ onOpenResumeCheck, onOpenRoleChooser, onOpenFreelancerSearch }: LandingPageProps) {
  const [pricingTab, setPricingTab] = useState<'freelancer' | 'recruiter'>('freelancer');
  const [activeFrlFilter, setActiveFrlFilter] = useState('all');

  useEffect(() => {
    // Force scroll to top on mount to fix the issue where it loads at the bottom on refresh
    window.scrollTo(0, 0);
  }, []);

  const frlFilters = [
    { label: 'All', val: 'all' },
    { label: 'Design', val: 'design' },
    { label: 'Development', val: 'dev' },
    { label: 'Content', val: 'content' },
    { label: 'Video & Audio', val: 'video' },
    { label: 'Marketing', val: 'marketing' }
  ];

  const PRICING = {
    freelancer: {
      color: 'var(--violet-700)',
      tint: 'var(--lavender-50)',
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
      color: 'var(--violet-700)',
      tint: 'var(--lavender-50)',
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
      cta: 'Upgrade — ₹1,499/month'
    }
  };

  const currentPricing = PRICING[pricingTab];
  const CHK = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );

  return (
    <div className="landing-page-root">
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Your Next Job.<br />
            Or Your Next <span className="accent">Client.</span>
          </h1>
          <p className="sub">
            Job seekers: free resume check. Freelancers: get listed free. Recruiters: find &amp; hire freelancers free. Ek hi platform, teeno ke liye.
          </p>

          <div className="hero-btns">
            <button className="hero-btn primary" onClick={onOpenResumeCheck}>
              Why am I not getting hired?
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>

            <div className="hero-cta-label">Freelance marketplace — hire, or get hired</div>
            <div className="hero-btn-row">
              <button className="hero-btn secondary" onClick={onOpenFreelancerSearch}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Find Freelancer
                <span className="hero-btn-sub">I'm hiring</span>
              </button>
              <button className="hero-btn secondary" onClick={onOpenRoleChooser}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Register as Freelancer
                <span className="hero-btn-sub">I want work</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FREELANCER CARDS */}
      <div className="frl-section" id="freelancerSection">
        <div className="frl-head">
          <h3 className="sec-title">Freelancers on LucoHire</h3>
          <span className="frl-count">6,200+ live</span>
        </div>

        <div className="frl-filter-row" id="frlFilterRow">
          {frlFilters.map(f => (
            <button 
              key={f.val} 
              className={`frl-filter-chip ${activeFrlFilter === f.val ? 'on' : ''}`}
              onClick={() => setActiveFrlFilter(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="frl-grid">

          {/* Card 1 — boosted */}
          <div className="frl-wrap">
            <div className="frl-boost-tag">⚡ Boosted profile · Responds fast</div>
            <div className="frl-card">
              <div className="frl-top">
                <div className="frl-photo-wrap">
                  <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Ananya Verma" />
                  <span className="frl-online"></span>
                </div>
                <div className="frl-info">
                  <div className="frl-name-row"><div className="frl-name">Ananya Verma</div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#4A3AE0"/><path d="M6 10.2l2.4 2.4L14 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="frl-role">SaaS Content Writer</div>
                  <div className="frl-loc-row">📍 Pune · 🌐 Remote</div>
                </div>
                <div className="frl-rating-col">
                  <div className="frl-rating"><span>★</span> 4.9</div>
                  <div className="frl-rating-lbl">120 jobs</div>
                </div>
              </div>
              <div className="frl-meta-row">
                <div className="frl-meta-col"><div className="frl-meta-num">3+ Yrs</div><div className="frl-meta-lbl">Experience</div></div>
                <div className="frl-meta-col"><div className="frl-meta-num">100%</div><div className="frl-meta-lbl">Response rate</div></div>
                <div className="frl-meta-col"><div className="frl-meta-num">Today</div><div className="frl-meta-lbl">Can start</div></div>
              </div>
              <div className="frl-skills"><span className="frl-chip">SaaS Copy</span><span className="frl-chip">SEO Writing</span><span className="frl-chip">Notion</span></div>
              <div className="frl-boxes">
                <div className="frl-box"><div className="big">₹4<span>/word</span></div><div className="box-lbl">Starting rate</div></div>
                <div className="frl-box avail"><div className="big">3 slots<span>open</span></div><div className="box-lbl">This month</div></div>
              </div>
              <div className="frl-verify-row">
                <div className="frl-verify-item">✔ ID Verified</div>
                <div className="frl-verify-item">✔ Portfolio Verified</div>
                <div className="frl-verify-item">✔ Payment Verified</div>
              </div>
              <div className="frl-actions-row">
                <button className="frl-btn-outline" onClick={onOpenFreelancerSearch}>View Profile</button>
                <button className="frl-btn-primary" onClick={onOpenFreelancerSearch}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Message
                </button>
                <button className="frl-btn-heart">♡</button>
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
                  <div className="frl-name-row"><div className="frl-name">Rohit Malhotra</div></div>
                  <div className="frl-role">Voice-over &amp; Audio Editor</div>
                  <div className="frl-loc-row">📍 Lucknow · 🌐 Remote</div>
                </div>
                <div className="frl-rating-col">
                  <div className="frl-rating"><span>★</span> 4.8</div>
                  <div className="frl-rating-lbl">80 jobs</div>
                </div>
              </div>
              <div className="frl-meta-row">
                <div className="frl-meta-col"><div className="frl-meta-num">5+ Yrs</div><div className="frl-meta-lbl">Experience</div></div>
                <div className="frl-meta-col"><div className="frl-meta-num">95%</div><div className="frl-meta-lbl">Response rate</div></div>
                <div className="frl-meta-col"><div className="frl-meta-num">Tomorrow</div><div className="frl-meta-lbl">Can start</div></div>
              </div>
              <div className="frl-skills"><span className="frl-chip">Voice-over</span><span className="frl-chip">Audio Editing</span><span className="frl-chip">Hindi + English</span></div>
              <div className="frl-boxes">
                <div className="frl-box"><div className="big">₹2,500<span>/project</span></div><div className="box-lbl">Starting rate</div></div>
                <div className="frl-box avail"><div className="big">5 slots<span>open</span></div><div className="box-lbl">This month</div></div>
              </div>
              <div className="frl-verify-row">
                <div className="frl-verify-item">✔ ID Verified</div>
                <div className="frl-verify-item">✔ Portfolio Verified</div>
              </div>
              <div className="frl-actions-row">
                <button className="frl-btn-outline" onClick={onOpenFreelancerSearch}>View Profile</button>
                <button className="frl-btn-primary" onClick={onOpenFreelancerSearch}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Message
                </button>
                <button className="frl-btn-heart">♡</button>
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
                  <div className="frl-name-row"><div className="frl-name">Meher Kaur</div>
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#4A3AE0"/><path d="M6 10.2l2.4 2.4L14 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="frl-role">Logo &amp; Brand Designer</div>
                  <div className="frl-loc-row">📍 Delhi · 🌐 Remote</div>
                </div>
                <div className="frl-rating-col">
                  <div className="frl-rating"><span>★</span> 5.0</div>
                  <div className="frl-rating-lbl">150 jobs</div>
                </div>
              </div>
              <div className="frl-meta-row">
                <div className="frl-meta-col"><div className="frl-meta-num">4+ Yrs</div><div className="frl-meta-lbl">Experience</div></div>
                <div className="frl-meta-col"><div className="frl-meta-num">98%</div><div className="frl-meta-lbl">Response rate</div></div>
                <div className="frl-meta-col"><div className="frl-meta-num">Today</div><div className="frl-meta-lbl">Can start</div></div>
              </div>
              <div className="frl-skills"><span className="frl-chip">Figma</span><span className="frl-chip">Branding</span><span className="frl-chip">Illustration</span></div>
              <div className="frl-boxes">
                <div className="frl-box"><div className="big">₹3,000<span>/logo</span></div><div className="box-lbl">Starting rate</div></div>
                <div className="frl-box avail"><div className="big">2 slots<span>open</span></div><div className="box-lbl">This month</div></div>
              </div>
              <div className="frl-verify-row">
                <div className="frl-verify-item">✔ ID Verified</div>
                <div className="frl-verify-item">✔ Portfolio Verified</div>
                <div className="frl-verify-item">✔ Payment Verified</div>
              </div>
              <div className="frl-actions-row">
                <button className="frl-btn-outline" onClick={onOpenFreelancerSearch}>View Profile</button>
                <button className="frl-btn-primary" onClick={onOpenFreelancerSearch}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Message
                </button>
                <button className="frl-btn-heart">♡</button>
              </div>
            </div>
          </div>

          {/* View more */}
          <div className="frl-more-card">
            <div className="n">+6,197</div>
            <div className="t">More freelancers waiting</div>
            <div className="d">Browse everyone, filtered by skill, rate, rating or location.</div>
            <button onClick={onOpenFreelancerSearch}>View All Freelancers →</button>
          </div>

        </div>
      </div>

      {/* HOW LUCOHIRE WORKS — PERSONA CARDS */}
      <div className="persona-section" id="howItWorksSection">
        <p className="eyebrow">How LucoHire Works</p>
        <h3 className="sec-title">One platform. Two sides. Real work, done fast.</h3>
        <p className="sec-lead">
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
              <div className="persona-item"><span className="ic">⚡</span>List your skills too, and pick up freelance work while you search</div>
            </div>
          </div>

          <div className="persona-card freelancer">
            <span className="persona-tag">FOR FREELANCERS</span>
            <h3>Find freelance jobs online and get hired faster.</h3>
            <p>Create your free profile, get discovered by verified clients, and start earning from home — no bidding wars, no fee to apply.</p>
            <div className="persona-list">
              <div className="persona-item"><span className="ic">✓</span>Get notified the instant a client posts work matching your skill</div>
              <div className="persona-item"><span className="ic">✓</span>A verified profile ranks higher and gets picked first</div>
              <div className="persona-item"><span className="ic">⚡</span>List every skill you freelance in — design, writing, dev, more</div>
            </div>
          </div>

          <div className="persona-card recruiter">
            <span className="persona-tag">FOR CLIENTS &amp; RECRUITERS</span>
            <h3>Hire freelancers online — fast, free and verified.</h3>
            <p>Post a job for free and get matched with ID-verified freelancers across design, development, content, video and marketing.</p>
            <div className="persona-list">
              <div className="persona-item"><span className="ic">✓</span>Message your first <b style={{ color: 'var(--green)' }}>4 freelancers</b> free on any requirement</div>
              <div className="persona-item"><span className="ic">✓</span>Every matching freelancer is notified the moment you post</div>
              <div className="persona-item"><span className="ic">⚡</span>Too many applicants? Let us shortlist the top 5–6 for you</div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider"><div className="line"></div><div className="dot"></div><div className="line rev"></div></div>

      {/* YOUR PATH TO JOB-READY */}
      <div className="path2-section" id="oneFlowSection">
        <div className="center-head">
          <p className="eyebrow mobile-eyebrow">Your Path to Job-Ready</p>
          <span className="path2-badge desktop-badge"><span className="dot"></span>YOUR PATH TO JOB-READY</span>
          <h3 className="path2-title sec-title">One flow, start to finish.</h3>
          <p className="path2-lead sec-lead">So you're not jumping across 5 apps just to prep for one job.</p>
        </div>

        {/* Mobile View: Vertical list */}
        <div className="path2-list mobile-path-list">
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

        {/* Desktop View: 5 cards in a row */}
        <div className="path-grid desktop-path-grid">
          <div className="path-card">
            <div className="path2-num">1</div>
            <h4>Check karo and batao</h4>
            <p>We compare the job to your profile and name the exact gaps — not a generic syllabus everyone gets.</p>
          </div>
          <div className="path-card active">
            <div className="path2-num">2</div>
            <h4>Padhaao</h4>
            <span className="path2-pill">IN PROGRESS</span>
            <p>Bite-sized lessons on just those gaps — SQL joins, System Design basics, whatever's actually missing.</p>
          </div>
          <div className="path-card">
            <div className="path2-num">3</div>
            <h4>Practice karao</h4>
            <p>Real interview-style questions and scenarios, not flashcards — until it actually sticks.</p>
          </div>
          <div className="path-card">
            <div className="path2-num">4</div>
            <h4>Test karo</h4>
            <p>A timed test built like what recruiters actually screen for — no guessing your own score.</p>
          </div>
          <div className="path-card">
            <div className="path2-num">5</div>
            <h4>Bata do — ready hoon ya nahi</h4>
            <p>One straight verdict: job-ready, or exactly what's left before you can say yes.</p>
          </div>
        </div>

        <div className="path2-progress">
          <div className="path2-target">🎯</div>
          <p>Example: a Senior UX Designer candidate reaches <b>68% ready</b> after Padhaao — 2 topics left before "go apply."</p>
          <div className="path2-bar"><span style={{ width: '68%' }}></span></div>
        </div>

        <div className="path-cta">
          <button className="hero-btn primary" onClick={onOpenResumeCheck}>
            Start My Resume Check
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <div className="divider"><div className="line"></div><div className="dot"></div><div className="line rev"></div></div>

      {/* PRICING */}
      <div className="pricing-section" id="pricingSection">
        <p className="eyebrow">Free vs Paid</p>
        <h3 className="sec-title">What's free, and what's worth paying for</h3>

        <div className="price-tabs">
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

        <div className="price-card">
          <div className="price-cols">
            <div className="price-col free">
              <div className="price-col-lbl">Free</div>
              <div className="price-amt">{currentPricing.freeAmt}<span>{currentPricing.freeUnit}</span></div>
              {currentPricing.free.map((f, i) => (
                <div key={i} className="price-feat" style={{ color: 'var(--green)' }}>
                  {CHK}<span style={{ color: 'var(--ink-soft)' }}>{f}</span>
                </div>
              ))}
            </div>
            <div className="price-col premium" style={{ background: currentPricing.tint }}>
              <div className="premium-badge">WORTH IT</div>
              <div className="price-col-lbl" style={{ color: currentPricing.color }}>Paid</div>
              <div className="price-amt" style={{ color: currentPricing.color }}>
                {currentPricing.premAmt}<span style={{ color: currentPricing.color, opacity: 0.7 }}>{currentPricing.premUnit}</span>
              </div>
              {currentPricing.prem.map((f, i) => (
                <div key={i} className="price-feat" style={{ color: currentPricing.color }}>
                  {CHK}<span style={{ color: 'var(--ink-soft)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="price-why" dangerouslySetInnerHTML={{ __html: currentPricing.why }}></div>
          <div className="price-social">
            <div className="avatars"><span></span><span></span><span></span></div>
            {currentPricing.social}
          </div>
          <div className="price-cta-row">
            <button className="price-cta" style={{ background: currentPricing.color }}>{currentPricing.cta}</button>
          </div>
        </div>
      </div>

      <div className="divider"><div className="line"></div><div className="dot"></div><div className="line rev"></div></div>

      {/* TRUST */}
      <div className="trust-section" id="trustSection">
        <p className="eyebrow">Why LucoHire</p>
        <h3 className="sec-title trust-head">Built so both sides show up serious</h3>
        <div className="trust-row">
          <div className="trust-item"><div className="ti-num">98%</div><div className="ti-lbl">Requirements get a response</div></div>
          <div className="trust-item"><div className="ti-num">~12 min</div><div className="ti-lbl">Avg. freelancer response time</div></div>
          <div className="trust-item"><div className="ti-num">4.7★</div><div className="ti-lbl">Avg. freelancer rating</div></div>
        </div>
      </div>
    </div>
  );
}
