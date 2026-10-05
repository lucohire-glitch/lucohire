/**
 * FreelancersView component
 * Replicates the standalone freelancers.html UI and functionality in React
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import LucoLogo from './LucoLogo';
import './FreelancersView.css';

export interface FreelancerItem {
  id: number;
  name: string;
  role: string;
  cat: 'content' | 'video' | 'design' | 'dev' | 'marketing';
  city: string;
  rating: number;
  jobs: number;
  exp: number;
  resp: number;
  start: number; // 0: Today, 1: Tomorrow, 2: This week
  skills: string[];
  rate: string;
  unit: string;
  proj: number;
  slots: number;
  ver: [number, number, number]; // [id, portfolio, payment]
  boost: boolean;
  img: string;
}

const FREELANCERS_DATA: FreelancerItem[] = [
  { id: 0, name: "Ananya Verma", role: "SaaS Content Writer", cat: "content", city: "Pune", rating: 4.9, jobs: 120, exp: 3, resp: 100, start: 0, skills: ["SaaS Copy", "SEO Writing", "Notion"], rate: "₹4", unit: "/word", proj: 2000, slots: 3, ver: [1, 1, 1], boost: true, img: "women/68" },
  { id: 1, name: "Rohit Malhotra", role: "Voice-over & Audio Editor", cat: "video", city: "Lucknow", rating: 4.8, jobs: 80, exp: 5, resp: 95, start: 1, skills: ["Voice-over", "Audio Editing", "Hindi + English"], rate: "₹2,500", unit: "/project", proj: 2500, slots: 5, ver: [1, 1, 0], boost: false, img: "men/52" },
  { id: 2, name: "Meher Kaur", role: "Logo & Brand Designer", cat: "design", city: "Delhi", rating: 5.0, jobs: 150, exp: 4, resp: 98, start: 0, skills: ["Figma", "Branding", "Illustration"], rate: "₹3,000", unit: "/logo", proj: 3000, slots: 2, ver: [1, 1, 1], boost: false, img: "women/54" },
  { id: 3, name: "Arjun Nair", role: "React Developer", cat: "dev", city: "Bengaluru", rating: 4.9, jobs: 96, exp: 6, resp: 99, start: 0, skills: ["React", "Next.js", "TypeScript"], rate: "₹15,000", unit: "/project", proj: 15000, slots: 2, ver: [1, 1, 1], boost: true, img: "men/32" },
  { id: 4, name: "Sneha Iyer", role: "Social Media Marketer", cat: "marketing", city: "Chennai", rating: 4.7, jobs: 64, exp: 3, resp: 92, start: 2, skills: ["Instagram", "Reels Strategy", "Ads"], rate: "₹8,000", unit: "/month", proj: 8000, slots: 4, ver: [1, 1, 0], boost: false, img: "women/44" },
  { id: 5, name: "Karan Mehta", role: "Video Editor — Reels & YouTube", cat: "video", city: "Mumbai", rating: 4.8, jobs: 110, exp: 4, resp: 97, start: 0, skills: ["Premiere Pro", "Reels", "Motion Text"], rate: "₹1,500", unit: "/video", proj: 1500, slots: 6, ver: [1, 1, 1], boost: false, img: "men/75" },
  { id: 6, name: "Pooja Sharma", role: "UI/UX Designer", cat: "design", city: "Jaipur", rating: 4.9, jobs: 72, exp: 5, resp: 96, start: 1, skills: ["Figma", "Design Systems", "Prototyping"], rate: "₹12,000", unit: "/project", proj: 12000, slots: 2, ver: [1, 1, 1], boost: true, img: "women/12" },
  { id: 7, name: "Imran Qureshi", role: "WordPress Developer", cat: "dev", city: "Hyderabad", rating: 4.6, jobs: 58, exp: 4, resp: 90, start: 2, skills: ["WordPress", "Elementor", "WooCommerce"], rate: "₹6,000", unit: "/site", proj: 6000, slots: 3, ver: [1, 0, 0], boost: false, img: "men/22" },
  { id: 8, name: "Riya Das", role: "Copywriter", cat: "content", city: "Kolkata", rating: 4.7, jobs: 88, exp: 2, resp: 94, start: 0, skills: ["Ad Copy", "Blog Writing", "Hindi + English"], rate: "₹2", unit: "/word", proj: 1500, slots: 5, ver: [1, 1, 0], boost: false, img: "women/33" },
  { id: 9, name: "Vikram Singh", role: "Performance Marketer", cat: "marketing", city: "Gurugram", rating: 4.8, jobs: 49, exp: 7, resp: 98, start: 1, skills: ["Meta Ads", "Google Ads", "Analytics"], rate: "₹20,000", unit: "/month", proj: 20000, slots: 1, ver: [1, 1, 1], boost: false, img: "men/41" },
  { id: 10, name: "Neha Joshi", role: "Illustrator", cat: "design", city: "Indore", rating: 4.9, jobs: 134, exp: 6, resp: 99, start: 0, skills: ["Procreate", "Character Art", "Book Covers"], rate: "₹2,000", unit: "/illustration", proj: 2000, slots: 3, ver: [1, 1, 1], boost: true, img: "women/26" },
  { id: 11, name: "Aditya Rao", role: "Python Developer", cat: "dev", city: "Bengaluru", rating: 4.7, jobs: 61, exp: 5, resp: 93, start: 2, skills: ["Python", "Django", "APIs"], rate: "₹10,000", unit: "/project", proj: 10000, slots: 2, ver: [1, 0, 1], boost: false, img: "men/64" }
];

const START_TIMES = ["Today", "Tomorrow", "This week"];

const CATEGORIES: Record<string, string> = {
  all: "All",
  design: "Design",
  dev: "Development",
  content: "Content",
  video: "Video & Audio",
  marketing: "Marketing"
};

const PAGE_SIZE = 6;

const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2);

const BUDGET_OPTIONS = [
  { value: 'any', label: 'Any budget' },
  { value: 'u2', label: 'Under ₹2,000' },
  { value: '2-5', label: '₹2,000 – ₹5,000' },
  { value: '5-10', label: '₹5,000 – ₹10,000' },
  { value: '10p', label: '₹10,000+' }
];

const EXP_OPTIONS = [
  { value: 0, label: 'Any experience' },
  { value: 1, label: '1+ years' },
  { value: 3, label: '3+ years' },
  { value: 5, label: '5+ years' }
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any rating' },
  { value: 4.5, label: '4.5★ & up' },
  { value: 4.8, label: '4.8★ & up' }
];

const START_OPTIONS = [
  { value: 9, label: 'Any time' },
  { value: 0, label: 'Today' },
  { value: 1, label: 'Within 2 days' },
  { value: 2, label: 'This week' }
];

const SORT_OPTIONS = [
  { value: 'rec', label: 'Recommended' },
  { value: 'rating', label: 'Top rated' },
  { value: 'jobs', label: 'Most jobs done' },
  { value: 'exp', label: 'Most experienced' },
  { value: 'rate', label: 'Lowest starting rate' }
];

interface CustomDropdownProps {
  id: string;
  label?: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (val: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

function CustomDropdown({
  id,
  label,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  className = ''
}: CustomDropdownProps) {
  const currentOption = options.find(o => o.value === value) || options[0];

  return (
    <div className={`f-field custom-dropdown-wrap ${isOpen ? 'is-open' : ''} ${className}`} id={`wrap-${id}`}>
      {label && <label>{label}</label>}
      <div className="custom-dropdown-container">
        <button
          type="button"
          className={`custom-dropdown-trigger ${isOpen ? 'open' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="custom-dropdown-label">{currentOption?.label}</span>
          <svg
            className={`custom-dropdown-chevron ${isOpen ? 'rotate' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div className="custom-dropdown-menu" role="listbox">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={String(opt.value)}
                  className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    onToggle();
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface FreelancersViewProps {
  onBack: () => void;
  onOpenAuth: () => void;
  onGoToSection: (sectionId: string) => void;
  onOpenRoleChooser?: () => void;
  initialCategory?: string;
}

export default function FreelancersView({
  onBack,
  onOpenAuth,
  onGoToSection,
  onOpenRoleChooser,
  initialCategory = 'all'
}: FreelancersViewProps) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(initialCategory);
  const [city, setCity] = useState('any');
  const [budget, setBudget] = useState('any');
  const [exp, setExp] = useState(0);
  const [rating, setRating] = useState(0);
  const [start, setStart] = useState(9);
  const [ver, setVer] = useState(false);
  const [fast, setFast] = useState(false);
  const [boost, setBoost] = useState(false);
  const [sort, setSort] = useState<'rec' | 'rating' | 'jobs' | 'exp' | 'rate'>('rec');
  const [shownCount, setShownCount] = useState(PAGE_SIZE);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const toggleDropdown = (id: string) => {
    setOpenDropdownId(prev => (prev === id ? null : id));
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions and custom dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSuggestOpen(false);
      }
      if (!target.closest('.custom-dropdown-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Unique cities list
  const uniqueCities = useMemo(() => {
    return Array.from(new Set(FREELANCERS_DATA.map(d => d.city))).sort();
  }, []);

  // City dropdown options
  const cityOptions = useMemo(() => {
    return [
      { value: 'any', label: 'Anywhere (Remote)' },
      ...uniqueCities.map(c => ({ value: c, label: c }))
    ];
  }, [uniqueCities]);

  // Suggestions for search
  const suggestions = useMemo(() => {
    const all = Array.from(new Set(FREELANCERS_DATA.flatMap(d => [d.role, ...d.skills])));
    if (!q.trim()) {
      return all.slice(0, 6);
    }
    const lower = q.trim().toLowerCase();
    return all.filter(item => item.toLowerCase().includes(lower)).slice(0, 6);
  }, [q]);

  const budgetOk = (proj: number, b: string) => {
    if (b === 'any') return true;
    if (b === 'u2') return proj < 2000;
    if (b === '2-5') return proj >= 2000 && proj < 5000;
    if (b === '5-10') return proj >= 5000 && proj < 10000;
    if (b === '10p') return proj >= 10000;
    return true;
  };

  // Filtered & sorted freelancers
  const filteredList = useMemo(() => {
    const query = q.trim().toLowerCase();

    return FREELANCERS_DATA.filter(d => {
      if (query) {
        const hay = (d.name + ' ' + d.role + ' ' + d.city + ' ' + d.skills.join(' ')).toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (cat !== 'all' && d.cat !== cat) return false;
      if (city !== 'any' && d.city !== city) return false;
      if (!budgetOk(d.proj, budget)) return false;
      if (d.exp < exp) return false;
      if (d.rating < rating) return false;
      if (start !== 9 && d.start > start) return false;
      if (ver && !d.ver.every(Boolean)) return false;
      if (fast && d.resp < 95) return false;
      if (boost && !d.boost) return false;
      return true;
    }).sort((a, b) => {
      if (sort === 'rec') {
        const aB = a.boost ? 1 : 0;
        const bB = b.boost ? 1 : 0;
        return (bB - aB) || (b.rating - a.rating);
      }
      if (sort === 'rating') {
        return (b.rating - a.rating) || (b.jobs - a.jobs);
      }
      if (sort === 'jobs') {
        return b.jobs - a.jobs;
      }
      if (sort === 'exp') {
        return b.exp - a.exp;
      }
      if (sort === 'rate') {
        return a.proj - b.proj;
      }
      return 0;
    });
  }, [q, cat, city, budget, exp, rating, start, ver, fast, boost, sort]);

  // Active filters list for chips
  const activeTags = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    if (q) list.push({ key: 'q', label: `“${q}”` });
    if (cat !== 'all') list.push({ key: 'cat', label: CATEGORIES[cat] || cat });
    if (city !== 'any') list.push({ key: 'city', label: city });
    if (budget !== 'any') {
      const budgetMap: Record<string, string> = {
        'u2': 'Under ₹2,000',
        '2-5': '₹2,000 – ₹5,000',
        '5-10': '₹5,000 – ₹10,000',
        '10p': '₹10,000+'
      };
      list.push({ key: 'budget', label: budgetMap[budget] || budget });
    }
    if (exp > 0) list.push({ key: 'exp', label: `${exp}+ yrs` });
    if (rating > 0) list.push({ key: 'rating', label: `${rating}★ & up` });
    if (start !== 9) {
      const startMap: Record<number, string> = { 0: 'Today', 1: 'Within 2 days', 2: 'This week' };
      list.push({ key: 'start', label: `Start: ${startMap[start] || 'Any'}` });
    }
    if (ver) list.push({ key: 'ver', label: 'Verified' });
    if (fast) list.push({ key: 'fast', label: 'Responds fast' });
    if (boost) list.push({ key: 'boost', label: 'Boosted' });
    return list;
  }, [q, cat, city, budget, exp, rating, start, ver, fast, boost]);

  const clearTag = (key: string) => {
    if (key === 'q') setQ('');
    if (key === 'cat') setCat('all');
    if (key === 'city') setCity('any');
    if (key === 'budget') setBudget('any');
    if (key === 'exp') setExp(0);
    if (key === 'rating') setRating(0);
    if (key === 'start') setStart(9);
    if (key === 'ver') setVer(false);
    if (key === 'fast') setFast(false);
    if (key === 'boost') setBoost(false);
    setShownCount(PAGE_SIZE);
  };

  const resetAllFilters = () => {
    setQ('');
    setCat('all');
    setCity('any');
    setBudget('any');
    setExp(0);
    setRating(0);
    setStart(9);
    setVer(false);
    setFast(false);
    setBoost(false);
    setShownCount(PAGE_SIZE);
  };

  const toggleLike = (id: number) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleFreelancers = filteredList.slice(0, shownCount);
  const remainingCount = filteredList.length - shownCount;

  return (
    <div className="freelancers-page-app">
      {/* HEADER */}
      <header className="header" style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)' }}>
        <div className="freelancers-page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="icon-btn" 
              onClick={onBack}
              aria-label="Back to home"
              title="Back to home"
              style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--ink)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div 
              className="brand" 
              onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <LucoLogo size={20} />
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 800 }}>
                <span className="luco" style={{ color: 'var(--ink)' }}>Luco</span>
                <span className="hire" style={{ color: 'var(--violet-700)' }}>Hire</span>
              </div>
            </div>
          </div>

          <nav className="header-desktop-nav" style={{ gap: '6px' }}>
            <a href="#freelancers" onClick={(e) => { e.preventDefault(); onBack(); setTimeout(() => onGoToSection('freelancerSection'), 100); }}>Freelancers</a>
            <a href="#howItWorks" onClick={(e) => { e.preventDefault(); onBack(); setTimeout(() => onGoToSection('howItWorksSection'), 100); }}>How it works</a>
            <a href="#oneFlow" onClick={(e) => { e.preventDefault(); onBack(); setTimeout(() => onGoToSection('oneFlowSection'), 100); }}>Job-ready path</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); onBack(); setTimeout(() => onGoToSection('pricingSection'), 100); }}>Free vs Paid</a>
          </nav>

          <button className="icon-btn" aria-label="Account" onClick={onOpenAuth} style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
        </div>
      </header>

      {/* PAGE TITLE */}
      <section className="pg-head">
          <button className="crumb" onClick={onBack}>
            ← Back to home
          </button>
          <h1>Freelancers on LucoHire</h1>
          <p>Browse 6,200+ verified freelancers. Narrow down by skill, city, budget and availability — then message the first 4 free.</p>
        </section>

        {/* SMART FILTERS */}
        <section className="filters">
          <div className="filter-card">
            {/* Search Input with dropdown suggestions */}
            <div className="f-search" ref={searchContainerRef}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="q"
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIsSuggestOpen(true);
                  setShownCount(PAGE_SIZE);
                }}
                onFocus={() => setIsSuggestOpen(true)}
                placeholder="Search by name, skill or role (e.g. Logo design, React developer)"
                autoComplete="off"
              />
              {q && (
                <button className="f-search-clear" onClick={() => { setQ(''); setIsSuggestOpen(false); }}>
                  ✕
                </button>
              )}

              {/* Autocomplete Suggestions Menu */}
              {isSuggestOpen && suggestions.length > 0 && (
                <div className="f-suggest-box">
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="f-suggest-item"
                      onClick={() => {
                        setQ(item);
                        setIsSuggestOpen(false);
                        setShownCount(PAGE_SIZE);
                      }}
                    >
                      <span>{item}</span>
                      <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Filter</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Chips */}
            <div className="f-chips" id="catChips">
              {['all', 'design', 'dev', 'content', 'video', 'marketing'].map((key) => (
                <button
                  key={key}
                  className={`frl-filter-chip ${cat === key ? 'on' : ''}`}
                  onClick={() => {
                    setCat(key);
                    setShownCount(PAGE_SIZE);
                  }}
                >
                  {CATEGORIES[key]}
                </button>
              ))}
            </div>

            {/* 5 Dropdowns Grid */}
            <div className="f-grid">
              {/* Location */}
              <CustomDropdown
                id="fCity"
                label="Location"
                value={city}
                options={cityOptions}
                onChange={(val) => {
                  setCity(val);
                  setShownCount(PAGE_SIZE);
                }}
                isOpen={openDropdownId === 'fCity'}
                onToggle={() => toggleDropdown('fCity')}
              />

              {/* Budget */}
              <CustomDropdown
                id="fBudget"
                label="Budget"
                value={budget}
                options={BUDGET_OPTIONS}
                onChange={(val) => {
                  setBudget(val);
                  setShownCount(PAGE_SIZE);
                }}
                isOpen={openDropdownId === 'fBudget'}
                onToggle={() => toggleDropdown('fBudget')}
              />

              {/* Experience */}
              <CustomDropdown
                id="fExp"
                label="Experience"
                value={exp}
                options={EXP_OPTIONS}
                onChange={(val) => {
                  setExp(Number(val));
                  setShownCount(PAGE_SIZE);
                }}
                isOpen={openDropdownId === 'fExp'}
                onToggle={() => toggleDropdown('fExp')}
              />

              {/* Rating */}
              <CustomDropdown
                id="fRating"
                label="Rating"
                value={rating}
                options={RATING_OPTIONS}
                onChange={(val) => {
                  setRating(Number(val));
                  setShownCount(PAGE_SIZE);
                }}
                isOpen={openDropdownId === 'fRating'}
                onToggle={() => toggleDropdown('fRating')}
              />

              {/* Can Start */}
              <CustomDropdown
                id="fStart"
                label="Can start"
                value={start}
                options={START_OPTIONS}
                onChange={(val) => {
                  setStart(Number(val));
                  setShownCount(PAGE_SIZE);
                }}
                isOpen={openDropdownId === 'fStart'}
                onToggle={() => toggleDropdown('fStart')}
              />
            </div>

            {/* Toggles & Clear */}
            <div className="f-foot">
              <label className={`toggle ${ver ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={ver}
                  onChange={(e) => {
                    setVer(e.target.checked);
                    setShownCount(PAGE_SIZE);
                  }}
                />
                <span className="sw"></span>
                Verified only
              </label>

              <label className={`toggle ${fast ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={fast}
                  onChange={(e) => {
                    setFast(e.target.checked);
                    setShownCount(PAGE_SIZE);
                  }}
                />
                <span className="sw"></span>
                Responds fast (95%+)
              </label>

              <label className={`toggle ${boost ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={boost}
                  onChange={(e) => {
                    setBoost(e.target.checked);
                    setShownCount(PAGE_SIZE);
                  }}
                />
                <span className="sw"></span>
                Boosted profiles
              </label>

              {activeTags.length > 0 && (
                <span className="f-clear" onClick={resetAllFilters}>
                  Clear all filters
                </span>
              )}
            </div>
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section className="results">
          {/* Results Bar */}
          <div className="res-bar">
            <div className="res-count">
              Showing <b>{Math.min(shownCount, filteredList.length)}</b> of <b>{filteredList.length}</b> matching freelancers <span style={{ opacity: 0.7 }}>· 6,200+ on LucoHire</span>
            </div>

            <div className="res-sort">
              <span className="res-sort-label">Sort by:</span>
              <CustomDropdown
                id="fSort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={(val) => setSort(val)}
                isOpen={openDropdownId === 'fSort'}
                onToggle={() => toggleDropdown('fSort')}
                className="res-sort-dropdown"
              />
            </div>
          </div>

          {/* Active Tags */}
          {activeTags.length > 0 && (
            <div className="active-tags">
              {activeTags.map((tag) => (
                <span
                  key={tag.key}
                  className="atag"
                  onClick={() => clearTag(tag.key)}
                >
                  {tag.label} ✕
                </span>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          {visibleFreelancers.length > 0 ? (
            <div className="pg-grid">
              {visibleFreelancers.map((d) => {
                const isAllVer = d.ver.every(Boolean);
                const isLiked = likedIds.has(d.id);
                const verifyItems = ['ID Verified', 'Portfolio Verified', 'Payment Verified'].filter((_, k) => d.ver[k]);

                return (
                  <div key={d.id} className="frl-wrap">
                    {d.boost && (
                      <div className="frl-boost-tag">
                        ⚡ Boosted profile · Responds fast
                      </div>
                    )}
                    <div className="frl-card">
                      <div className="frl-top">
                        <div className="frl-photo-wrap" data-i={initials(d.name)}>
                          <img
                            src={`https://randomuser.me/api/portraits/${d.img}.jpg`}
                            alt={d.name}
                            loading="lazy"
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                          <span className="frl-online"></span>
                        </div>
                        <div className="frl-info">
                          <div className="frl-name-row">
                            <div className="frl-name">{d.name}</div>
                            {isAllVer && (
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="10" fill="#4A3AE0" />
                                <path d="M6 10.2l2.4 2.4L14 7" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
                          <div className="frl-meta-num">{START_TIMES[d.start]}</div>
                          <div className="frl-meta-lbl">Can start</div>
                        </div>
                      </div>

                      <div className="frl-skills">
                        {d.skills.map((s, idx) => (
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
                          <div key={idx} className="frl-verify-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="frl-actions-row">
                        <button className="frl-btn-outline" onClick={onOpenRoleChooser}>
                          View Profile
                        </button>
                        <button className="frl-btn-primary" onClick={onOpenRoleChooser}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Message
                        </button>
                        <button
                          className={`frl-btn-heart ${isLiked ? 'frl-heart-on' : ''}`}
                          onClick={() => toggleLike(d.id)}
                          aria-label="Favorite freelancer"
                        >
                          {isLiked ? '♥' : '♡'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-res">
              <div className="big">🔍</div>
              <h3>No freelancers match these filters</h3>
              <p>Try removing a filter or searching a broader skill.</p>
              <button onClick={resetAllFilters}>Clear all filters</button>
            </div>
          )}

          {/* Load More Button */}
          {remainingCount > 0 && (
            <div className="load-more">
              <button onClick={() => setShownCount(prev => prev + PAGE_SIZE)}>
                Load {Math.min(PAGE_SIZE, remainingCount)} more freelancers
              </button>
            </div>
          )}
        </section>

      {/* FOOTER */}
      <footer className="footer" style={{ marginTop: '40px' }}>
        <div className="footer-inner">
          <div className="footer-brand-side">
            <div className="logo" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <LucoLogo size={20} />
              </div>
              <div>
                <span className="luco" style={{ color: '#fff' }}>Luco</span>
                <span className="hire" style={{ color: 'var(--gold)' }}>Hire</span>
              </div>
            </div>
            <p className="ftag">
              India's AI-assisted freelance marketplace to hire verified freelancers online and find freelance jobs that actually pay — fair distribution, WhatsApp-first support.
            </p>
          </div>

          <div className="footer-links-side">
            <div className="footer-cols">
              <div className="footer-col">
                <h5>For Freelancers</h5>
                <a href="#jobs" onClick={(e) => { e.preventDefault(); onBack(); onOpenRoleChooser?.(); }}>Find Freelance Jobs</a>
                <a href="#profile" onClick={(e) => { e.preventDefault(); onBack(); onOpenRoleChooser?.(); }}>Create Your Profile</a>
                <a href="#pricing" onClick={(e) => { e.preventDefault(); onBack(); setTimeout(() => onGoToSection('pricingSection'), 100); }}>Pricing</a>
              </div>
              <div className="footer-col">
                <h5>For Clients &amp; Recruiters</h5>
                <a href="#post" onClick={(e) => { e.preventDefault(); onBack(); onOpenRoleChooser?.(); }}>Post a Requirement</a>
                <a href="#find" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Find Freelancers</a>
                <a href="#pricing" onClick={(e) => { e.preventDefault(); onBack(); setTimeout(() => onGoToSection('pricingSection'), 100); }}>Pricing</a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-inner" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
          <span>© 2026 LucoHire. All rights reserved.</span>
          <span style={{ background: 'rgba(34,197,94,0.15)', color: '#8CF0C2', padding: '4px 9px', borderRadius: '99px', fontWeight: 600 }}>🔒 Secure &amp; verified</span>
        </div>
      </footer>
    </div>
  );
}
