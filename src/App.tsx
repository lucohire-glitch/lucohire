/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import LucoLogo from './components/LucoLogo';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import RoleChooserModal from './components/RoleChooserModal';
import CandidateRegistration from './components/CandidateRegistration';
import RecruiterRegistration from './components/RecruiterRegistration';
import CandidateDashboard from './components/CandidateDashboard';
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
        <CandidateDashboard
          isOpen={isProfileHomeOpen}
          userData={candidateData || {}}
          onClose={() => setIsProfileHomeOpen(false)}
          onOpenResumeCheck={() => {
            setIsProfileHomeOpen(false);
            setIsResumeCheckOpen(true);
            window.scrollTo({ top: 0, behavior: 'auto' });
          }}
          onOpenAuth={() => {
            setIsProfileHomeOpen(false);
            setIsAuthOpen(true);
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

      {/* MAIN LANDING PAGE COMPONENT */}
      <LandingPage 
        onOpenResumeCheck={() => setIsResumeCheckOpen(true)}
        onOpenRoleChooser={() => setIsRoleChooserOpen(true)}
        onOpenFreelancerSearch={() => scrollTo('frlSection')}
      />



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

      <CandidateDashboard
        isOpen={isProfileHomeOpen}
        userData={candidateData || {}}
        onClose={() => setIsProfileHomeOpen(false)}
        onOpenResumeCheck={() => {
          setIsProfileHomeOpen(false);
          setIsResumeCheckOpen(true);
          window.scrollTo({ top: 0, behavior: 'auto' });
        }}
        onOpenAuth={() => {
          setIsProfileHomeOpen(false);
          setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
