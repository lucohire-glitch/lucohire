import React, { useState } from 'react';
import './CandidateDashboard.css';

interface EmployerDashboardProps {
  isOpen: boolean;
  userData?: any;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export default function EmployerDashboard({ isOpen, userData, onClose, onOpenAuth }: EmployerDashboardProps) {
  const [currentView, setCurrentView] = useState<'jobs' | 'leads'>('jobs');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<any>(null);

  // Boost banner state
  const [isBoosted, setIsBoosted] = useState(false);

  // Modal / Sheet overlay state
  const [sheetContent, setSheetContent] = useState<React.ReactNode | null>(null);

  // Filter states
  const [xSt, setXSt] = useState<string>('all');
  const [xSk, setXSk] = useState<string>('all');

  // Accordion for "Send my price" open lead index
  const [openQuoteIndex, setOpenQuoteIndex] = useState<number | null>(null);
  const [quoteInputPrice, setQuoteInputPrice] = useState<string>('');
  const [quoteInputDays, setQuoteInputDays] = useState<string>('');
  const [quoteInputMsg, setQuoteInputMsg] = useState<string>('');
  const [sentQuotes, setSentQuotes] = useState<{ [key: number]: string }>({});

  // Rating & Review State
  const [ratingData, setRatingData] = useState<{ index: number; stars: number; tags: string[]; text: string } | null>(null);
  const [reportReasonIndex, setReportReasonIndex] = useState<number | null>(null);

  // Max seats for jobs
  const XMAX = 15;

  // Jobs state (XJ from media HTML)
  const [jobs, setJobs] = useState([
    {
      t: 'UI/UX Designer — Contract',
      co: 'Zentro Labs',
      loc: 'Noida',
      b: '₹15,000',
      m: 94,
      n: 9,
      w: 0,
      s: 'open',
      when: 'Within 2 weeks',
      d: 'Design 8 screens of a mobile app in Figma. You work from home. Zentro Labs will share the written brief after you are selected.',
      l: ['Design 8 app screens in Figma', 'Make a simple clickable demo', 'Change the design once after feedback']
    },
    {
      t: 'Brand Designer — Project',
      co: 'Horizon Retail',
      loc: 'Noida',
      b: '₹10,000',
      m: 88,
      n: 15,
      w: 6,
      s: 'full',
      when: 'Within 10 days',
      d: 'Horizon Retail is opening a new shop and needs a full look: logo, colours and shop board design.',
      l: ['Logo with 2 options', 'Colours and font choice', 'Shop board design file']
    },
    {
      t: 'Logo + Packaging, 4 SKUs',
      co: 'Nimbus Foods',
      loc: 'Remote',
      b: '₹8,000',
      m: 91,
      n: 15,
      w: 6,
      s: 'waiting',
      when: 'Within 3 weeks',
      d: 'Packaging design for 4 snack products. You work from home and send files online.',
      l: ['Logo', 'Pack design for 4 products', 'Print-ready files']
    },
    {
      t: 'Dashboard UI Revamp',
      co: 'Quanta Systems',
      loc: 'Noida',
      b: '₹12,000',
      m: 85,
      n: 15,
      w: 0,
      s: 'rejected',
      when: 'Within 2 weeks',
      d: 'Redesign of an office dashboard so it looks cleaner and is easier to use.',
      l: ['Redesign 5 screens', 'Colour and font guide']
    }
  ]);

  // Leads state (XL from media HTML)
  const [leads, setLeads] = useState([
    {
      n: 'Priya Malhotra',
      tm: '12 min ago',
      sk: ['Logo Design', 'Brand Identity'],
      br: 'Needs a logo and basic brand kit for a new skincare brand. Launching next month.',
      b: 'Offered ₹12,000',
      bn: '₹12,000',
      d: '10 days',
      s: 'new',
      loc: 'Online',
      l: ['Logo with 2 options', 'Colours and font choice', 'Simple brand guide (PDF)'],
      rv: null as { r: number; tags: string[]; t: string } | null
    },
    {
      n: 'Arjun Studios',
      tm: '2 hr ago',
      sk: ['Figma UI Design'],
      br: 'Needs Figma help about 10 hours every week for an office dashboard product.',
      b: 'Offered ₹8,000 per project',
      bn: '₹8,000',
      d: '5 days',
      s: 'new',
      loc: 'Online',
      l: ['About 10 hours of work every week', 'Update existing Figma screens', 'Join a short call once a week'],
      rv: null as { r: number; tags: string[]; t: string } | null
    },
    {
      n: 'Simran Kaur',
      tm: 'Yesterday',
      sk: ['Figma UI Design'],
      br: 'Wants a full redesign of a booking app. Sent a Notion file with examples.',
      b: 'Offered ₹25,000',
      bn: '₹25,000',
      d: '15 days',
      s: 'replied',
      loc: 'Online',
      l: ['Redesign all app screens', 'Follow the examples she shared', 'Hand over Figma file'],
      rv: null as { r: number; tags: string[]; t: string } | null
    },
    {
      n: 'Nimbus Foods',
      tm: '3 days ago',
      sk: ['Logo Design'],
      br: 'Packaging design for 4 products. Deal is fixed and advance is paid.',
      b: 'Agreed ₹18,000 · paid',
      bn: '₹18,000',
      d: '',
      s: 'won',
      loc: 'Online',
      l: ['Pack design for 4 products', 'Print-ready files'],
      rv: null as { r: number; tags: string[]; t: string } | null
    }
  ]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToastMsg(null), 2600);
    setToastTimer(t);
  };

  const closeSheet = () => setSheetContent(null);

  // Job Actions
  const handleApplyJob = (i: number) => {
    const updated = [...jobs];
    updated[i].n++;
    updated[i].s = 'applied';
    setJobs(updated);
    closeSheet();
    showToast('Done. You applied for this job.');
  };

  const handleWaitJob = (i: number) => {
    const updated = [...jobs];
    updated[i].w++;
    updated[i].s = 'waiting';
    setJobs(updated);
    closeSheet();
    showToast('You are on the waiting list.');
  };

  const openJobSheet = (i: number) => {
    const j = jobs[i];
    setSheetContent(
      <>
        <h3>{j.t}</h3>
        <div className="x-m">{j.co}</div>
        <div className="x-kv"><span>Money</span><b>{j.b}</b></div>
        <div className="x-kv"><span>Time to finish</span><b>{j.when}</b></div>
        <div className="x-kv"><span>Place</span><b>{j.loc}</b></div>
        <div className="x-kv"><span>Your match</span><b>{j.m}%</b></div>
        <div className="x-h">About this job</div>
        <p>{j.d}</p>
        <div className="x-h">What you have to do</div>
        <ul>{j.l.map((x, k) => <li key={k}>{x}</li>)}</ul>
        <div className="x-gap" style={{ flexDirection: 'column', marginTop: '18px' }}>
          {j.s === 'open' && (
            <button className="x-b x-pri x-full" onClick={() => handleApplyJob(i)}>Apply for this job</button>
          )}
          {j.s === 'full' && (
            <button className="x-b x-out x-full" onClick={() => handleWaitJob(i)}>Join the waiting list</button>
          )}
          {j.s === 'applied' && (
            <button className="x-b x-out x-full" disabled>✓ You have applied</button>
          )}
          {j.s === 'waiting' && (
            <button className="x-b x-out x-full" disabled>You are on the waiting list</button>
          )}
          <button className="x-b x-out" onClick={closeSheet}>Close</button>
        </div>
      </>
    );
  };

  // Boost Action Modal
  const openBoostModal = () => {
    setSheetContent(
      <>
        <h3>Pay ₹99 to show first?</h3>
        <p style={{ marginTop: '8px' }}>
          People searching <b>Figma UI Design</b> in <b>Noida</b> will see your profile at the top. Other people still show below you.
        </p>
        <div className="x-gap" style={{ marginTop: '18px' }}>
          <button className="x-b x-out" onClick={closeSheet}>No, go back</button>
          <button
            className="x-b x-pri"
            onClick={() => {
              setIsBoosted(true);
              closeSheet();
              showToast('You are now shown first.');
            }}
          >
            Yes, pay ₹99
          </button>
        </div>
      </>
    );
  };

  // Lead Actions
  const openLeadSheet = (i: number) => {
    const l = leads[i];
    setSheetContent(
      <>
        <h3>{l.n}</h3>
        <div className="x-m">Needs: {l.sk.join(', ')}</div>
        <div className="x-kv"><span>Money</span><b>{l.b}</b></div>
        {l.d && <div className="x-kv"><span>Needed in</span><b>{l.d}</b></div>}
        <div className="x-kv"><span>Place</span><b>{l.loc}</b></div>
        <div className="x-kv"><span>Contacted you</span><b>{l.tm}</b></div>
        <div className="x-h">About this project</div>
        <p>{l.br}</p>
        <div className="x-h">What you have to do</div>
        <ul>{l.l.map((x, k) => <li key={k}>{x}</li>)}</ul>
        <div className="x-gap" style={{ flexDirection: 'column', marginTop: '18px' }}>
          <button className="x-b x-wa" onClick={() => { closeSheet(); showToast(`Opening chat with ${l.n.split(' ')[0]}…`); }}>
            Message recruiter
          </button>
          <button className="x-b x-out" onClick={() => { closeSheet(); showToast(`We asked ${l.n.split(' ')[0]} to call you.`); }}>
            Ask for a call
          </button>
          {l.s === 'won' && (
            <button className="x-b x-out" onClick={() => { closeSheet(); openRateModal(i); }}>
              {l.rv ? '★ Change my review' : '★ Rate this recruiter'}
            </button>
          )}
          <button className="x-b x-out" onClick={closeSheet}>Close</button>
        </div>
      </>
    );
  };

  // Rating & Review Modals
  const openRateModal = (i: number) => {
    const l = leads[i];
    const initial = l.rv ? { index: i, stars: l.rv.r, tags: [...l.rv.tags], text: l.rv.t } : { index: i, stars: 0, tags: [], text: '' };
    setRatingData(initial);
  };

  const submitRating = (data: { index: number; stars: number; tags: string[]; text: string }) => {
    const updated = [...leads];
    updated[data.index].rv = { r: data.stars, tags: data.tags, t: data.text.trim() };
    setLeads(updated);
    setRatingData(null);
    closeSheet();
    showToast('Thank you! Your review is saved.');
  };

  const openReportModal = (i: number) => {
    setReportReasonIndex(null);
    const l = leads[i];
    const reasons = [
      'Job was different from what they said',
      'Asked me to talk outside the app',
      'Did not pay me',
      'Rude or abusive behaviour',
      'Other'
    ];
    setSheetContent(
      <>
        <h3>Report a problem</h3>
        <div className="x-m">About {l.n}. Our team will check it.</div>
        <div className="x-tags">
          {reasons.map((w, k) => (
            <span
              key={k}
              className={`x-tg ${reportReasonIndex === k ? 'on' : ''}`}
              onClick={() => {
                setReportReasonIndex(k);
                openReportModalWithReason(i, k);
              }}
            >
              {w}
            </span>
          ))}
        </div>
        <textarea id="xRpT" rows={3} placeholder="Tell us what happened (not compulsory)"></textarea>
        <div className="x-gap" style={{ flexDirection: 'column' }}>
          <button
            className="x-b x-pri"
            onClick={() => {
              closeSheet();
              showToast('Report sent. We will check it.');
            }}
          >
            Send report
          </button>
          <button className="x-b x-out" onClick={() => openRateModal(i)}>Go back</button>
        </div>
      </>
    );
  };

  const openReportModalWithReason = (i: number, selectedK: number) => {
    const l = leads[i];
    const reasons = [
      'Job was different from what they said',
      'Asked me to talk outside the app',
      'Did not pay me',
      'Rude or abusive behaviour',
      'Other'
    ];
    setSheetContent(
      <>
        <h3>Report a problem</h3>
        <div className="x-m">About {l.n}. Our team will check it.</div>
        <div className="x-tags">
          {reasons.map((w, k) => (
            <span
              key={k}
              className={`x-tg ${selectedK === k ? 'on' : ''}`}
              onClick={() => openReportModalWithReason(i, k)}
            >
              {w}
            </span>
          ))}
        </div>
        <textarea id="xRpT" rows={3} placeholder="Tell us what happened (not compulsory)"></textarea>
        <div className="x-gap" style={{ flexDirection: 'column' }}>
          <button
            className="x-b x-pri"
            onClick={() => {
              closeSheet();
              showToast('Report sent. We will check it.');
            }}
          >
            Send report
          </button>
          <button className="x-b x-out" onClick={() => openRateModal(i)}>Go back</button>
        </div>
      </>
    );
  };

  // Handle quote send or agree
  const handleSendQuote = (i: number, isAgree?: boolean) => {
    const l = leads[i];
    const text = isAgree
      ? `✓ You agreed to ${l.bn}. ${l.n.split(' ')[0]} will see it.`
      : `✓ Your price is sent. ${l.n.split(' ')[0]} will see it.`;

    setSentQuotes(prev => ({ ...prev, [i]: text }));
    if (l.s === 'new') {
      const updated = [...leads];
      updated[i].s = 'replied';
      setLeads(updated);
    }
    setOpenQuoteIndex(null);
  };

  // Filtered Leads
  const XLBL: { [key: string]: string } = { new: 'New', replied: 'I replied', won: 'Got the work' };
  const allSkills = Array.from(new Set(leads.flatMap(l => l.sk)));

  const filteredLeads = leads.filter(l => (xSt === 'all' || l.s === xSt) && (xSk === 'all' || l.sk.includes(xSk)));

  return (
    <div className="candidate-dashboard-container employer-view" style={{ position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto' }}>

      {/* Toast popup */}
      <div className={`x-toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>

      {/* Sheet overlay modal */}
      <div
        className={`x-overlay ${sheetContent || ratingData ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeSheet();
            setRatingData(null);
          }
        }}
      >
        <div className="x-sheet">
          {ratingData ? (
            (() => {
              const l = leads[ratingData.index];
              const XGOOD = ['Paid on time', 'Clear instructions', 'Polite', 'Replied fast'];
              const XBAD = ['Paid late', 'Work kept changing', 'Not clear what they wanted', 'Rude behaviour'];
              const XRL = ['', 'Very bad', 'Not good', 'Okay', 'Good', 'Very good'];
              const set = ratingData.stars && ratingData.stars <= 3 ? XBAD : XGOOD;

              return (
                <>
                  <h3>How was your work with {l.n}?</h3>
                  <div className="x-m">Your review helps other workers. The recruiter will see your name and review.</div>
                  <div className="x-stars">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className={`x-star ${n <= ratingData.stars ? 'on' : ''}`}
                        onClick={() => {
                          const newTags = (ratingData.stars <= 3) !== (n <= 3) ? [] : ratingData.tags;
                          setRatingData({ ...ratingData, stars: n, tags: newTags });
                        }}
                        aria-label={`${n} star`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="x-rl">{XRL[ratingData.stars]}</div>

                  {ratingData.stars > 0 && (
                    <>
                      <div className="x-h" style={{ marginTop: 0 }}>What was good or bad? (tap)</div>
                      <div className="x-tags">
                        {set.map((t, k) => {
                          const isOn = ratingData.tags.includes(t);
                          return (
                            <span
                              key={k}
                              className={`x-tg ${isOn ? 'on' : ''}`}
                              onClick={() => {
                                const nextTags = isOn ? ratingData.tags.filter(x => x !== t) : [...ratingData.tags, t];
                                setRatingData({ ...ratingData, tags: nextTags });
                              }}
                            >
                              {t}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <textarea
                    rows={3}
                    placeholder="Write a few words about the work (not compulsory)"
                    value={ratingData.text}
                    onChange={(e) => setRatingData({ ...ratingData, text: e.target.value })}
                  />
                  <div className="x-gap" style={{ flexDirection: 'column' }}>
                    <button
                      className="x-b x-pri"
                      disabled={!ratingData.stars}
                      onClick={() => submitRating(ratingData)}
                    >
                      Submit my review
                    </button>
                    <button className="x-b x-out" onClick={() => setRatingData(null)}>Cancel</button>
                  </div>
                  <span className="x-rep" onClick={() => { setRatingData(null); openReportModal(ratingData.index); }}>
                    Something went wrong? Report a problem
                  </span>
                </>
              );
            })()
          ) : (
            sheetContent
          )}
        </div>
      </div>

      {/* VIEW 1: JOBS TAB */}
      {currentView === 'jobs' && (
        <div className="app-view active screen">
          <div className="topbar">
            <div>
              <p className="greeting-eyebrow">Jobs posted by recruiters</p>
              <p className="greeting">Jobs for you</p>
              <p className="x-sub" style={{ marginTop: '8px', marginBottom: 0 }}>Pick a job and apply. Then wait for the recruiter to reply.</p>
            </div>
            <div className="topbar-actions">
              <div className="avatar-chip" onClick={() => onOpenAuth?.()} title="Account & sign-in">
                {(userData?.name || 'R')[0].toUpperCase()}
              </div>
            </div>
          </div>

          <section>
            {/* Boost Card */}
            {isBoosted ? (
              <div className="x-boost on">
                <p><b>✓ You are at the top</b>People searching Figma UI Design in Noida see you first.</p>
              </div>
            ) : (
              <div className="x-boost">
                <p><b>Want to be seen first?</b>Pay ₹99 and show at the top for Figma UI Design in Noida. Everything else is free.</p>
                <button className="x-b x-pri" onClick={openBoostModal}>Show me first · ₹99</button>
              </div>
            )}

            {/* Jobs List */}
            {jobs.map((j, i) => {
              const isFull = j.n >= XMAX;
              const isRej = j.s === 'rejected';

              return (
                <div key={i} className={`x-card ${isRej ? 'x-dim' : ''}`}>
                  <div className="x-row">
                    <div>
                      <div className="x-t">{j.t}</div>
                      <div className="x-m">{j.co} · {j.loc} · {j.b}</div>
                    </div>
                    <span className={`x-tag ${j.m >= 90 ? 'hi' : ''}`}>{j.m}% match</span>
                  </div>

                  {isRej ? (
                    <div className="x-note r" style={{ marginTop: '12px' }}>
                      The recruiter rejected your profile.
                    </div>
                  ) : (
                    <>
                      <div className="x-slot">
                        <div className={`x-bar ${isFull ? 'full' : ''}`}>
                          <i style={{ width: `${Math.min(100, (j.n / XMAX) * 100)}%` }}></i>
                        </div>
                        <span>
                          <b>{j.n} of {XMAX}</b> people applied{isFull ? <> · <b>{j.w} waiting</b></> : ''}
                        </span>
                      </div>

                      {j.s === 'open' && <div className="x-note">Seats are left. Apply now.</div>}
                      {j.s === 'full' && (
                        <div className="x-note w">
                          All 15 seats are full. You can still join the waiting list. If the recruiter looks at more people, your name may come.
                        </div>
                      )}
                      {j.s === 'applied' && <div className="x-note ok">You applied. Now wait for the recruiter to reply.</div>}
                      {j.s === 'waiting' && (
                        <div className="x-note w">
                          You are on the waiting list. If the recruiter looks at more people, your name may come.
                        </div>
                      )}

                      <div className="x-gap" style={{ flexDirection: 'column' }}>
                        {j.s === 'open' && (
                          <button className="x-b x-pri x-full" onClick={() => handleApplyJob(i)}>Apply for this job</button>
                        )}
                        {j.s === 'full' && (
                          <button className="x-b x-out x-full" onClick={() => handleWaitJob(i)}>Join the waiting list</button>
                        )}
                        {j.s === 'applied' && (
                          <button className="x-b x-out x-full" disabled>✓ You have applied</button>
                        )}
                        {j.s === 'waiting' && (
                          <button className="x-b x-out x-full" disabled>You are on the waiting list</button>
                        )}
                      </div>
                    </>
                  )}

                  <div className="x-gap">
                    <button className="x-b x-out" onClick={() => openJobSheet(i)}>See job details</button>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}

      {/* VIEW 2: RECRUITER MESSAGE (LEADS) TAB */}
      {currentView === 'leads' && (
        <div className="app-view active screen">
          <div className="topbar">
            <div>
              <p className="greeting-eyebrow">Customers who contacted you</p>
              <p className="greeting">Recruiter Message</p>
              <p className="x-sub" style={{ marginTop: '8px', marginBottom: 0 }}>These people want to hire you. Reply fast to get the work.</p>
            </div>
            <div className="topbar-actions">
              <div className="avatar-chip" onClick={() => onOpenAuth?.()} title="Account & sign-in">
                {(userData?.name || 'R')[0].toUpperCase()}
              </div>
            </div>
          </div>

          <section>
            {/* Filter and Select Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
              {/* Filter Chips */}
              <div className="x-chips" style={{ marginBottom: 0 }}>
                {(['all', 'new', 'replied', 'won'] as const).map(k => {
                  const count = leads.filter(l => k === 'all' || l.s === k).length;
                  return (
                    <div
                      key={k}
                      className={`x-chip ${xSt === k ? 'on' : ''}`}
                      onClick={() => setXSt(k)}
                    >
                      {k === 'all' ? 'All' : XLBL[k]} · {count}
                    </div>
                  );
                })}
              </div>

              {/* Skill Select Dropdown */}
              <select className="x-select" value={xSk} onChange={(e) => setXSk(e.target.value)} style={{ marginBottom: 0, width: 'auto', minWidth: '200px' }}>
                <option value="all">All my skills</option>
                {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Leads List */}
            {filteredLeads.length > 0 ? (
              filteredLeads.map((l, i) => {
                const isSent = sentQuotes[i];
                return (
                  <div className="x-card" key={i}>
                    <div className="x-row">
                      <div>
                        <div className="x-t">{l.n}</div>
                        <div className="x-m">Needs: {l.sk.join(', ')}</div>
                      </div>
                      <div className="x-m" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                        <span className={`x-dot x-${l.s}`}></span>
                        {XLBL[l.s]}
                      </div>
                    </div>

                    <p className="x-brief">{l.br}</p>

                    <div className="x-meta">
                      {l.b} {l.d ? <span>· needed in {l.d}</span> : ''} <span>· {l.tm}</span>
                    </div>

                    {isSent ? (
                      <div className="x-sent" style={{ display: 'block', marginTop: '10px' }}>
                        {isSent}
                      </div>
                    ) : (
                      <>
                        <div className="x-gap">
                          <button className="x-b x-wa" onClick={() => showToast(`Opening chat with ${l.n.split(' ')[0]}…`)}>
                            Message recruiter
                          </button>
                          {l.s === 'won' ? (
                            <button className="x-b x-out" onClick={() => openRateModal(i)}>
                              {l.rv ? `★ ${l.rv.r} · Change my review` : '★ Rate this recruiter'}
                            </button>
                          ) : (
                            <button
                              className="x-b x-out"
                              onClick={() => setOpenQuoteIndex(openQuoteIndex === i ? null : i)}
                            >
                              Send my price
                            </button>
                          )}
                        </div>

                        {/* Accordion panel for Send my price */}
                        <div className={`x-q ${openQuoteIndex === i ? 'open' : ''}`}>
                          <label>Your price (₹)</label>
                          <input
                            inputMode="numeric"
                            placeholder="Example: 14000"
                            value={quoteInputPrice}
                            onChange={(e) => setQuoteInputPrice(e.target.value)}
                          />
                          <label>How many days will you take?</label>
                          <select value={quoteInputDays} onChange={(e) => setQuoteInputDays(e.target.value)}>
                            <option>{l.d || 'As agreed'} (same as they asked)</option>
                            <option>7 days</option>
                            <option>14 days</option>
                            <option>More than 14 days</option>
                          </select>
                          <label>Message (not compulsory)</label>
                          <textarea
                            rows={2}
                            placeholder="Example: This price includes 2 changes"
                            value={quoteInputMsg}
                            onChange={(e) => setQuoteInputMsg(e.target.value)}
                          />
                          <button className="x-b x-pri x-full" onClick={() => handleSendQuote(i, false)}>
                            Send my price to {l.n.split(' ')[0]}
                          </button>
                          <span className="x-agree" onClick={() => handleSendQuote(i, true)}>
                            Or agree to their price of {l.bn}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="x-gap" style={{ marginTop: '8px' }}>
                      <button className="x-b x-out" onClick={() => openLeadSheet(i)}>See project details</button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="x-empty">No leads here yet.</div>
            )}
          </section>
        </div>
      )}

      {/* EXACT HTML SPEC BOTTOM NAV (Dashboard [disabled], Jobs [active], Recruiter Message, Resume [disabled]) */}
      <div className="bottom-nav">
        <div className="nav-item disabled" aria-disabled="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
          Dashboard
        </div>
        <div className={`nav-item ${currentView === 'jobs' ? 'active' : ''}`} onClick={() => { setCurrentView('jobs'); window.scrollTo(0, 0); }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
          Jobs{currentView === 'jobs' && <span className="nav-dot"></span>}
        </div>
        <div className={`nav-item ${currentView === 'leads' ? 'active' : ''}`} onClick={() => { setCurrentView('leads'); window.scrollTo(0, 0); }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4H12a8.7 8.7 0 0 1-4-1L3 20l1.2-3.6a8.3 8.3 0 0 1-1.2-4.4A8.4 8.4 0 0 1 11.5 3h.5a8.4 8.4 0 0 1 8.4 8Z" /></svg>
          Recruiter Message{currentView === 'leads' && <span className="nav-dot"></span>}
        </div>
        <div className="nav-item disabled" aria-disabled="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
          Resume
        </div>
      </div>

    </div>
  );
}