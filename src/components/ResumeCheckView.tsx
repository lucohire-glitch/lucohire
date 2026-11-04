import React, { useState, useEffect, useMemo } from 'react';
import './ResumeCheckView.css';
import { fetchPublicScrapedJobs, ScrapedPublicJob } from '../api';

interface JobItem {
  id: string;
  title: string;
  company: string;
  meta: string;
  salary: string;
  logo: string;
  logoBg: string;
  logoColor: string;
  mode: string;
  exp: string;
  location: string;
  type: string;
  description: string;
}

const DEFAULT_JOBS: JobItem[] = [
  {
    id: 'm0',
    title: 'Content & E-commerce Manager',
    company: 'Himmaleh Sports',
    meta: 'Himmaleh Sports · Onsite · 2+ yrs · 25d ago',
    salary: '₹6–10L',
    logo: 'H',
    logoBg: '#FFF7ED',
    logoColor: '#C2410C',
    mode: 'Onsite',
    exp: '2+ yrs',
    location: 'Dehradun / Onsite',
    type: 'Full-time',
    description: 'Manage Shopify e-commerce operations, digital marketing campaigns, catalog management, customer retention, and brand story for an outdoor Himalayan brand.'
  },
  {
    id: 'm1',
    title: 'Senior Product Designer',
    company: 'Google',
    meta: 'Google · Hybrid · Bengaluru · 2d ago',
    salary: '₹18–32L',
    logo: 'G',
    logoBg: '#EFF6FF',
    logoColor: '#1A73E8',
    mode: 'Hybrid',
    exp: '5+ yrs',
    location: 'Bengaluru',
    type: 'Full-time',
    description: 'Design intuitive interfaces, create multi-modal design systems, and lead design thinking across Google Cloud and developer ecosystem products in India.'
  },
  {
    id: 'm2',
    title: 'UX Researcher',
    company: 'Microsoft',
    meta: 'Microsoft · Remote · 5d ago',
    salary: '₹16–30L',
    logo: 'M',
    logoBg: '#EFF6FF',
    logoColor: '#0067B8',
    mode: 'Remote',
    exp: '2+ yrs',
    location: 'Remote',
    type: 'Full-time',
    description: 'Conduct qualitative user studies, usability testing, and persona research to influence next-generation productivity and AI tools.'
  },
  {
    id: 'm3',
    title: 'Product Designer',
    company: 'Amazon',
    meta: 'Amazon · Onsite · Bengaluru · 1d ago',
    salary: '₹12–20L',
    logo: 'A',
    logoBg: '#FFFBEB',
    logoColor: '#B45309',
    mode: 'Onsite',
    exp: '2+ yrs',
    location: 'Bengaluru',
    type: 'Full-time',
    description: 'Craft delightful shopping, fulfillment, and seller experiences for Amazon India marketplace millions of daily users.'
  },
  {
    id: 'm4',
    title: 'Full Stack React Engineer',
    company: 'Meta',
    meta: 'Meta · Remote · 3+ yrs · 3d ago',
    salary: '₹22–38L',
    logo: 'M',
    logoBg: '#EFF6FF',
    logoColor: '#1877F2',
    mode: 'Remote',
    exp: '2+ yrs',
    location: 'Remote, India',
    type: 'Full-time',
    description: 'Build high-performance web interfaces and distributed frontend architectures serving billions of real-time interactions globally.'
  },
  {
    id: 'm5',
    title: 'Senior Frontend Architect',
    company: 'Swiggy',
    meta: 'Swiggy · Hybrid · Bengaluru · 4d ago',
    salary: '₹18–28L',
    logo: 'S',
    logoBg: '#FFF7ED',
    logoColor: '#EA580C',
    mode: 'Hybrid',
    exp: '5+ yrs',
    location: 'Bengaluru',
    type: 'Full-time',
    description: 'Architect low-latency consumer ordering surfaces, design micro-frontends, and lead performance engineering for high-traffic food and Instamart checkouts.'
  },
  {
    id: 'm6',
    title: 'Lead UI/UX Designer',
    company: 'CRED',
    meta: 'CRED · Onsite · Bengaluru · 1d ago',
    salary: '₹24–40L',
    logo: 'C',
    logoBg: '#F3F4F6',
    logoColor: '#111827',
    mode: 'Onsite',
    exp: '5+ yrs',
    location: 'Bengaluru',
    type: 'Full-time',
    description: 'Pioneer high-craft micro-interactions, neo-brutalist financial user interfaces, and engaging rewards mechanics for creditworthy members.'
  },
  {
    id: 'm7',
    title: 'Growth Product Manager',
    company: 'Razorpay',
    meta: 'Razorpay · Hybrid · Bengaluru · 6d ago',
    salary: '₹20–34L',
    logo: 'R',
    logoBg: '#EFF6FF',
    logoColor: '#2563EB',
    mode: 'Hybrid',
    exp: '2+ yrs',
    location: 'Bengaluru',
    type: 'Full-time',
    description: 'Lead checkout conversion rate optimization, merchant onboardings, and developer API experience for India leading payment gateway.'
  },
  {
    id: 'm8',
    title: 'Visual & Brand Designer',
    company: 'Zomato',
    meta: 'Zomato · Onsite · Gurugram · 5d ago',
    salary: '₹14–22L',
    logo: 'Z',
    logoBg: '#FEF2F2',
    logoColor: '#DC2626',
    mode: 'Onsite',
    exp: '2+ yrs',
    location: 'Gurugram',
    type: 'Full-time',
    description: 'Create memorable visual campaigns, quirky typography illustrations, and social brand collateral for millions of hungry foodies.'
  },
  {
    id: 'm9',
    title: 'Backend Node.js Developer',
    company: 'Zepto',
    meta: 'Zepto · Onsite · Mumbai · 2d ago',
    salary: '₹16–28L',
    logo: 'Z',
    logoBg: '#FAF5FF',
    logoColor: '#7C3AED',
    mode: 'Onsite',
    exp: '2+ yrs',
    location: 'Mumbai',
    type: 'Full-time',
    description: 'Power real-time dispatch algorithms, microsecond dark store inventory routing, and 10-minute delivery backend logistics.'
  }
];

const ITEMS_PER_PAGE = 5;

export default function ResumeCheckView({
  initialSearch = '',
  currentUser,
  userRole,
  onLogout,
  onOpenProfile,
  onOpenEmployerDashboard,
  onBack,
  onGoToFreelancers,
  onOpenAuth,
  onOpenRoleChooser,
  onOpenCandidateReg,
  onGoToPricing,
  onUpgradePlan
}: any) {
  const [searchQuery, setSearchQuery] = useState<string>(() => (typeof initialSearch === 'string' ? initialSearch : ''));
  const [locationFilter, setLocationFilter] = useState<'all' | 'Remote' | 'Hybrid' | 'Onsite'>('all');
  const [expFilter, setExpFilter] = useState<'all' | '0-2 yrs' | '2+ yrs' | '5+ yrs'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Full-time' | 'Contract'>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [expandedDescs, setExpandedDescs] = useState<Record<string, boolean>>({});
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});

  const [liveJobs, setLiveJobs] = useState<JobItem[]>(DEFAULT_JOBS);

  // Keep search query synced if initialSearch updates
  useEffect(() => {
    if (typeof initialSearch === 'string') {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Sync with live jobs from scraper API if available
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchPublicScrapedJobs({ limit: 46 })
      .then((res) => {
        if (res && res.jobs && Array.isArray(res.jobs) && res.jobs.length > 0) {
          const mapped: JobItem[] = res.jobs.map((j: ScrapedPublicJob, idx: number) => {
            const companyName = j.company || 'Tech Company';
            const jobTitle = j.title || 'Role';
            const firstChar = (companyName || jobTitle).charAt(0).toUpperCase() || 'J';
            const colors = [
              { bg: '#FFF7ED', color: '#C2410C' },
              { bg: '#EFF6FF', color: '#1A73E8' },
              { bg: '#EFF6FF', color: '#0067B8' },
              { bg: '#FFFBEB', color: '#B45309' },
              { bg: '#F3E8FF', color: '#7E22CE' },
              { bg: '#ECFDF5', color: '#047857' }
            ];
            const c = colors[idx % colors.length];
            return {
              id: `scraped-${j.id || idx}`,
              title: jobTitle,
              company: companyName,
              meta: `${companyName} · ${j.work_mode || 'Hybrid'} · ${j.experience_level || '2+ yrs'} · Recently`,
              salary: j.salary || '₹10–25L',
              logo: firstChar,
              logoBg: c.bg,
              logoColor: c.color,
              mode: j.work_mode || 'Hybrid',
              exp: j.experience_level || '2+ yrs',
              location: j.location || 'India',
              type: j.job_type || 'Full-time',
              description: j.description || `${jobTitle} at ${companyName}. Work with high-growth teams and cutting-edge tools.`
            };
          });
          setLiveJobs([...DEFAULT_JOBS, ...mapped]);
        }
      })
      .catch(() => {});
  }, []);

  // Reset to page 1 whenever filters or query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationFilter, expFilter, typeFilter]);

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleExpandDesc = (id: string) => {
    setExpandedDescs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleApply = (id: string) => {
    setAppliedJobs((prev) => ({ ...prev, [id]: true }));
    if (onOpenCandidateReg) {
      setTimeout(() => {
        onOpenCandidateReg();
      }, 350);
    }
  };

  const handleUnlockPro = () => {
    if (onGoToPricing) {
      onGoToPricing();
    } else {
      window.location.hash = 'pricingSection';
      const el = document.getElementById('pricingSection');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Safe filter jobs based on search query and chips
  const filteredJobs = useMemo(() => {
    const q = (typeof searchQuery === 'string' ? searchQuery : '').trim().toLowerCase();
    const locFilter = (locationFilter || 'all').toLowerCase();
    const expF = (expFilter || 'all').toLowerCase();
    const typF = (typeFilter || 'all').toLowerCase();

    return (liveJobs || []).filter((job) => {
      if (!job) return false;

      // Query filter
      if (q) {
        const title = String(job.title || '').toLowerCase();
        const company = String(job.company || '').toLowerCase();
        const meta = String(job.meta || '').toLowerCase();
        const location = String(job.location || '').toLowerCase();
        const desc = String(job.description || '').toLowerCase();

        const matchesQuery =
          title.includes(q) ||
          company.includes(q) ||
          meta.includes(q) ||
          location.includes(q) ||
          desc.includes(q);

        if (!matchesQuery) return false;
      }

      // Location filter
      if (locFilter !== 'all') {
        const mode = String(job.mode || '').toLowerCase();
        const loc = String(job.location || '').toLowerCase();
        if (!mode.includes(locFilter) && !loc.includes(locFilter)) {
          return false;
        }
      }

      // Experience filter
      if (expF !== 'all') {
        const exp = String(job.exp || '').toLowerCase();
        if (!exp.includes(expF)) {
          return false;
        }
      }

      // Type filter
      if (typF !== 'all') {
        const type = String(job.type || '').toLowerCase();
        if (!type.includes(typF)) {
          return false;
        }
      }

      return true;
    });
  }, [liveJobs, searchQuery, locationFilter, expFilter, typeFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredJobs.length);
  const paginatedJobs = useMemo(() => {
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const el = document.getElementById('jobsTopSection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 80, behavior: 'smooth' });
    }
  };

  // Chip cycle helpers
  const handleLocationChipClick = () => {
    const cycle: Array<'all' | 'Remote' | 'Hybrid' | 'Onsite'> = ['all', 'Remote', 'Hybrid', 'Onsite'];
    const nextIdx = (cycle.indexOf(locationFilter) + 1) % cycle.length;
    setLocationFilter(cycle[nextIdx]);
  };

  const handleExpChipClick = () => {
    const cycle: Array<'all' | '0-2 yrs' | '2+ yrs' | '5+ yrs'> = ['all', '0-2 yrs', '2+ yrs', '5+ yrs'];
    const nextIdx = (cycle.indexOf(expFilter) + 1) % cycle.length;
    setExpFilter(cycle[nextIdx]);
  };

  const handleTypeChipClick = () => {
    const cycle: Array<'all' | 'Full-time' | 'Contract'> = ['all', 'Full-time', 'Contract'];
    const nextIdx = (cycle.indexOf(typeFilter) + 1) % cycle.length;
    setTypeFilter(cycle[nextIdx]);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setExpFilter('all');
    setTypeFilter('all');
  };

  // Generate page numbers array with ellipses
  const renderPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis-start');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis-end');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="luco-jobsearch-wrap" id="jobsTopSection">
      <div className="pg">
        {/* TOP SEARCH & CONTROLS HEADER */}
        <header className="hd">
          <div className="bar">
            <div className="bar-left">
              <button
                type="button"
                className="back"
                aria-label="Back to Home"
                onClick={onBack}
                title="Back to Home"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                <span>Back to Home</span>
              </button>
            </div>
            <span className="brand-badge">
              ⚡ AI Job Search &amp; Resume Check
            </span>
          </div>

          <div className="search-controls-row">
            <div className="srch">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                aria-label="Search jobs"
                placeholder="Skill or job title, e.g. UX Designer, Frontend, Manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {Boolean(searchQuery) && (
                <button
                  className="clear-srch"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* FILTER CHIPS ROW */}
            <div className="chips">
              <button
                type="button"
                className={`chip ${locationFilter !== 'all' ? 'active' : ''}`}
                onClick={handleLocationChipClick}
                title="Click to cycle location filter"
              >
                {locationFilter === 'all' ? 'Location: All' : `Location: ${locationFilter}`}
              </button>
              <button
                type="button"
                className={`chip ${expFilter !== 'all' ? 'active' : ''}`}
                onClick={handleExpChipClick}
                title="Click to cycle experience filter"
              >
                {expFilter === 'all' ? 'Experience: All' : `Exp: ${expFilter}`}
              </button>
              <button
                type="button"
                className={`chip ${typeFilter !== 'all' ? 'active' : ''}`}
                onClick={handleTypeChipClick}
                title="Click to cycle job type filter"
              >
                {typeFilter === 'all' ? 'Type: All' : `Type: ${typeFilter}`}
              </button>
            </div>
          </div>
        </header>

        {/* RESULTS COUNT & PAGINATION SUMMARY */}
        <div className="cnt">
          <span>
            <b>{filteredJobs.length} jobs</b> found {filteredJobs.length > 0 && `(Showing ${startIndex + 1}–${endIndex})`}
          </span>
          {Boolean(searchQuery) && (
            <span style={{ fontSize: '13px', color: '#4F46E5', cursor: 'pointer' }} onClick={resetFilters}>
              Clear search &times;
            </span>
          )}
        </div>

        {/* JOB CARDS LIST */}
        <div className="list">
          {paginatedJobs.length === 0 ? (
            <div className="empty-state">
              <h4>No matching jobs found</h4>
              <p>We couldn't find any jobs matching "{searchQuery}". Try searching another title or clearing filters.</p>
              <button className="reset-btn" onClick={resetFilters}>
                Reset all filters
              </button>
            </div>
          ) : (
            paginatedJobs.map((job) => {
              const isExpanded = !!expandedCards[job.id];
              const isDescOpen = !!expandedDescs[job.id];
              const isApplied = !!appliedJobs[job.id];

              return (
                <article key={job.id} className="card">
                  {/* MAIN JOB INFO */}
                  <div className="main">
                    <div className="card-header-layout">
                      <div className="card-left-info">
                        <span
                          className="logo"
                          style={{
                            background: job.logoBg,
                            color: job.logoColor
                          }}
                        >
                          {job.logo}
                        </span>
                        <div className="info">
                          <h3>{job.title}</h3>
                          <div className="co">{job.meta}</div>
                        </div>
                      </div>

                      <div className="card-right-action">
                        <div className="sal">{job.salary}</div>
                        <div className="btns">
                          <button
                            type="button"
                            className="apply"
                            onClick={() => handleApply(job.id)}
                          >
                            {isApplied ? 'Application Sent ✓' : 'Apply Now'}
                            {!isApplied && (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" />
                              </svg>
                            )}
                          </button>

                          <button
                            type="button"
                            className="desc"
                            onClick={() => toggleExpandDesc(job.id)}
                          >
                            {isDescOpen ? 'Hide description' : 'See full description'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isDescOpen && (
                      <div className="job-full-desc">
                        <p style={{ margin: 0 }}>{job.description}</p>
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#6B7280' }}>
                          <b>Location:</b> {job.location} | <b>Mode:</b> {job.mode} | <b>Type:</b> {job.type}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI RESUME CHECK WARNING SECTION */}
                  <section className="ai">
                    <div className="head">
                      <span className="wi">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 3l10 18H2z" />
                          <path d="M12 10v5M12 18h.01" />
                        </svg>
                      </span>
                      <span className="wt">
                        <small>AI Resume Check</small>
                        <b>Wait — don't apply immediately</b>
                      </span>
                    </div>

                    <div className="body">
                      <div className="h">Here's what our AI found</div>
                      <div className="hs">Based on your resume and this role</div>

                      {/* 4 CORE FINDINGS IN RESPONSIVE GRID */}
                      <ul className="findings-grid">
                        <li>
                          <span className="ii">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </span>
                          <span>See yourself the way a recruiter would see your profile</span>
                        </li>

                        <li>
                          <span className="ii">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="9" cy="8" r="3.5" />
                              <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .7 3.5 2.6 3.5 5.5" />
                            </svg>
                          </span>
                          <span>Find out why another candidate could beat you to this job</span>
                        </li>

                        <li>
                          <span className="ii">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M4 20h4L19 9l-4-4L4 16z" />
                            </svg>
                          </span>
                          <span>See the changes you should make in your resume before applying</span>
                        </li>

                        <li>
                          <span className="ii">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
                            </svg>
                          </span>
                          <span>Discover what could make you a much stronger candidate</span>
                        </li>
                      </ul>

                      {/* EXPANDABLE PRO FINDINGS */}
                      {isExpanded && (
                        <div className="more">
                          <ul className="findings-grid">
                            <li>
                              <span className="ii">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M12 3l10 18H2z" />
                                  <path d="M12 10v5M12 18h.01" />
                                </svg>
                              </span>
                              <span>Learn the one thing that could send your resume to the rejection pile</span>
                            </li>

                            <li className="lk">
                              <span className="ii">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="5" y="11" width="14" height="9" rx="2" />
                                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                </svg>
                              </span>
                              <span>
                                Get your single highest-impact fix for this exact job<em>PRO</em>
                              </span>
                            </li>

                            <li className="lk">
                              <span className="ii">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <rect x="5" y="11" width="14" height="9" rx="2" />
                                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                </svg>
                              </span>
                              <span>
                                See where you could win, and where others may beat you<em>PRO</em>
                              </span>
                            </li>
                          </ul>

                          {/* UNLOCK WITH PRO */}
                          <div className="unlock">
                            <span>See the real, personalised answer for every point above</span>
                            <button type="button" onClick={handleUnlockPro}>
                              Unlock with Pro
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TOGGLE BUTTON */}
                      <button
                        type="button"
                        className="sm"
                        onClick={() => toggleExpandCard(job.id)}
                        aria-expanded={isExpanded}
                      >
                        {!isExpanded ? (
                          <span className="s1">
                            Show 3 more
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </span>
                        ) : (
                          <span className="s2">
                            Show less
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="m6 15 6-6 6 6" />
                            </svg>
                          </span>
                        )}
                      </button>
                    </div>
                  </section>
                </article>
              );
            })
          )}
        </div>

        {/* PAGINATION CONTROLS BAR */}
        {filteredJobs.length > ITEMS_PER_PAGE && (
          <div className="pagination-wrap">
            <div className="pagination-info">
              Showing <b>{startIndex + 1}</b> to <b>{endIndex}</b> of <b>{filteredJobs.length}</b> jobs
            </div>

            <div className="pagination-btns">
              <button
                type="button"
                className="page-nav-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous Page"
              >
                ← Prev
              </button>

              {renderPageNumbers().map((p, idx) => {
                if (typeof p === 'string') {
                  return (
                    <span key={`ellipsis-${idx}`} className="page-ellipsis">
                      …
                    </span>
                  );
                }
                return (
                  <button
                    key={p}
                    type="button"
                    className={`page-num-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => handlePageChange(p as number)}
                    aria-label={`Page ${p}`}
                    aria-current={currentPage === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                className="page-nav-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next Page"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
