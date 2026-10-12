import { FREELANCERS_DATA, FreelancerItem } from './FreelancersView';
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
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<FreelancerItem | null>(null);
  const [messageTarget, setMessageTarget] = useState<FreelancerItem | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const displayedFreelancers = FREELANCERS_DATA.filter((f: FreelancerItem) => {
    if (activeFrlFilter === 'all') return true;
    return f.cat === activeFrlFilter;
  });


  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        return;
      }
    }
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
          {displayedFreelancers.slice(0, 6).map((d: FreelancerItem) => {
            const isLiked = likedIds.has(d.id);
            const verifyItems = ['ID Verified', 'Portfolio Verified', 'Payment Verified'].filter((_, k) => d.ver[k]);

            return (
              <div className="frl-wrap" key={d.id}>
                {d.boost && (
                  <div className="frl-boost-tag">⚡ Boosted profile · Responds fast</div>
                )}
                <div className="frl-card">
                  <div className="frl-top">
                    <div className="frl-photo-wrap">
                      <img 
                        src={`https://randomuser.me/api/portraits/${d.img}.jpg`} 
                        alt={d.name}
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                      <span className="frl-online"></span>
                    </div>
                    <div className="frl-info">
                      <div className="frl-name-row">
                        <div className="frl-name">{d.name}</div>
                        {d.ver.every(Boolean) && (
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="10" fill="#4A3AE0"/>
                            <path d="M6 10.2l2.4 2.4L14 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="frl-role">{d.role}</div>
                      <div className="frl-loc-row">📍 {d.city} · 🌐 Remote</div>
                    </div>
                    <div className="frl-rating-col">
                      <div className="frl-rating"><span>★</span> {d.rating.toFixed(1)}</div>
                      <div className="frl-rating-lbl">{d.jobs} jobs</div>
                    </div>
                  </div>

                  <div className="frl-meta-row">
                    <div className="frl-meta-col">
                      <div className="frl-meta-num">{d.exp}+ Yrs</div>
                      <div className="frl-meta-lbl">Experience</div>
                    </div>
                    <div className="frl-meta-col">
                      <div className="frl-meta-num">{d.resp}%</div>
                      <div className="frl-meta-lbl">Response rate</div>
                    </div>
                    <div className="frl-meta-col">
                      <div className="frl-meta-num">{d.start === 0 ? 'Today' : d.start === 1 ? 'Tomorrow' : 'This week'}</div>
                      <div className="frl-meta-lbl">Can start</div>
                    </div>
                  </div>

                  <div className="frl-skills">
                    {d.skills.map((s: string, idx: number) => (
                      <span key={idx} className="frl-chip">{s}</span>
                    ))}
                  </div>

                  <div className="frl-boxes">
                    <div className="frl-box">
                      <div className="big">{d.rate}<span>{d.unit}</span></div>
                      <div className="box-lbl">Starting rate</div>
                    </div>
                    <div className="frl-box avail">
                      <div className="big">{d.slots} slots<span>open</span></div>
                      <div className="box-lbl">This month</div>
                    </div>
                  </div>

                  <div className="frl-verify-row">
                    {verifyItems.map((v, idx) => (
                      <div key={idx} className="frl-verify-item">✔ {v}</div>
                    ))}
                  </div>

                  <div className="frl-actions-row">
                    <button className="frl-btn-outline" onClick={() => setSelectedProfile(d)}>
                      View Profile
                    </button>
                    <button className="frl-btn-primary" onClick={() => { setMessageTarget(d); setMessageSent(false); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      Message
                    </button>
                    <button 
                      className={`frl-btn-heart ${isLiked ? 'liked' : ''}`}
                      onClick={() => {
                        setLikedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(d.id)) next.delete(d.id);
                          else next.add(d.id);
                          return next;
                        });
                      }}
                      style={{ color: isLiked ? '#E11D48' : undefined }}
                    >
                      {isLiked ? '♥' : '♡'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

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
    
      {/* FREELANCER FULL PROFILE MODAL */}
      {selectedProfile && (
        <div className="cr-preview-backdrop" onClick={() => setSelectedProfile(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="cr-preview-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setSelectedProfile(null)} 
              style={{ position: 'absolute', top: '18px', right: '18px', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', color: 'var(--ink-soft)' }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <img 
                src={`https://randomuser.me/api/portraits/${selectedProfile.img}.jpg`} 
                alt={selectedProfile.name}
                style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--violet-700, #4A3AE0)' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>{selectedProfile.name}</h3>
                  <span style={{ color: 'var(--violet-700, #4A3AE0)', fontSize: '14px' }}>✓</span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '13.5px', color: 'var(--ink-soft)' }}>{selectedProfile.role}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--ink-faint)' }}>📍 {selectedProfile.city} · 🌐 Remote Available</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '20px 0', background: 'var(--lavender-50, #F6F6F3)', padding: '14px', borderRadius: '14px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>★ {selectedProfile.rating.toFixed(1)}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>{selectedProfile.jobs} jobs completed</div>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>{selectedProfile.exp}+ Yrs</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>Experience</div>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--teal-deep, #1FA854)' }}>{selectedProfile.resp}%</div>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px' }}>Response rate</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>About & Experience</h4>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--ink-soft)' }}>
                Top-rated {selectedProfile.role} with verified experience in delivering high impact projects for startups and businesses. Fast turnaround, clean communication, and reliable delivery.
              </p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>Top Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedProfile.skills.map((s: string, idx: number) => (
                  <span key={idx} style={{ background: '#F4F5F7', border: '1px solid #E5E7EB', padding: '5px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '12px 14px', background: '#FAFAFA', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Starting rate</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>{selectedProfile.rate} <span style={{ fontSize: '12px', fontWeight: 500 }}>{selectedProfile.unit}</span></div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid #E5E7EB', paddingLeft: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Availability</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#10B981', marginTop: '3px' }}>{selectedProfile.slots} slots open this month</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => {
                  const p = selectedProfile;
                  setSelectedProfile(null);
                  setMessageTarget(p);
                  setMessageSent(false);
                }}
                style={{ flex: 1, background: 'var(--violet-700, #4A3AE0)', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                💬 Message Freelancer
              </button>
              <button 
                onClick={() => {
                  setLikedIds(prev => {
                    const next = new Set(prev);
                    if (next.has(selectedProfile.id)) next.delete(selectedProfile.id);
                    else next.add(selectedProfile.id);
                    return next;
                  });
                }}
                style={{ padding: '0 16px', borderRadius: '10px', border: '1px solid #E5E7EB', background: '#fff', fontSize: '18px', cursor: 'pointer', color: likedIds.has(selectedProfile.id) ? '#E11D48' : 'var(--ink)' }}
                title="Save to favorites"
              >
                {likedIds.has(selectedProfile.id) ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE PANEL MODAL */}
      {messageTarget && (
        <div className="cr-preview-backdrop" onClick={() => setMessageTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="cr-preview-modal" onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setMessageTarget(null)} 
              style={{ position: 'absolute', top: '18px', right: '18px', width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', color: 'var(--ink-soft)' }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>Message {messageTarget.name}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Typically responds in ~{messageTarget.resp > 95 ? '15 minutes' : '1 hour'} · Direct contact</p>

            {messageSent ? (
              <div style={{ background: '#E5F5EB', color: '#16A34A', padding: '16px', borderRadius: '12px', textAlign: 'center', margin: '16px 0' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>✓</div>
                <b style={{ fontSize: '14px' }}>Message delivered!</b>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>{messageTarget.name} has been notified via LucoHire WhatsApp & Email notification.</p>
                <button 
                  onClick={() => setMessageTarget(null)}
                  style={{ marginTop: '12px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <textarea 
                  id="landingMsgText"
                  rows={4}
                  defaultValue={`Hi ${messageTarget.name}, I found your profile on LucoHire for ${messageTarget.role}. Are you available for a project this month?`}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '13px', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: '14px' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      const text = (document.getElementById('landingMsgText') as HTMLTextAreaElement)?.value;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text || '')}`, '_blank');
                      setMessageSent(true);
                    }}
                    style={{ width: '100%', background: '#1FA854', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    💬 Chat Directly on WhatsApp
                  </button>
                  <button 
                    onClick={() => setMessageSent(true)}
                    style={{ width: '100%', background: 'var(--violet-700, #4A3AE0)', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    Send via LucoHire Portal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
