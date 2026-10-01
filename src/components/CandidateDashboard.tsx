import React, { useState, useEffect } from 'react';
import './CandidateDashboard.css';

interface CandidateDashboardProps {
  isOpen: boolean;
  userData?: any;
  onClose: () => void;
  onOpenResumeCheck?: () => void;
  onOpenAuth?: () => void;
}

export default function CandidateDashboard({ isOpen, userData, onClose, onOpenResumeCheck, onOpenAuth }: CandidateDashboardProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'leads' | 'resume' | 'signup'>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [openManagePanel, setOpenManagePanel] = useState<string | null>(null);
  const [openQuotePanel, setOpenQuotePanel] = useState<string | null>(null);
  const [resumeConverted, setResumeConverted] = useState(false);
  const [pct, setPct] = useState(0);

  const [skills, setSkills] = useState([
    { id: 1, name: 'Figma UI Design', level: 'Expert', exp: '3-5 yrs', price: '8000', type: 'Per project' },
    { id: 2, name: 'Logo Design', level: 'Expert', exp: '3-5 yrs', price: '3000', type: 'Per project' },
    { id: 3, name: 'Brand Identity', level: 'Intermediate', exp: '1-3 yrs', price: '12000', type: 'Per project' }
  ]);
  const [entries, setEntries] = useState([
    { id: 1, type: 'Education', title: 'B.Des', org: 'Design Studio Noida', dur: '2018–2022' },
    { id: 2, type: 'Work experience', title: 'UI Designer', org: 'Freelance', dur: '2022 - Present' }
  ]);
  const [certs, setCerts] = useState([
    { id: 1, type: 'Behance', val: 'behance.net/rahulkumar' }
  ]);
  const [langs, setLangs] = useState([
    { id: 1, name: 'Hindi', level: 'Expert' },
    { id: 2, name: 'English', level: 'Fluent' }
  ]);
  const [availDays, setAvailDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [langSelect, setLangSelect] = useState('Hindi');
  const [langLevel, setLangLevel] = useState('Basic');
  const [skillFilter, setSkillFilter] = useState('All skills');
  const [statusFilter, setStatusFilter] = useState('All · 6');
  const [sentQuotes, setSentQuotes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setPct(72), 120);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleManage = (panelId: string) => {
    setOpenManagePanel(prev => prev === panelId ? null : panelId);
  };

  const toggleQuote = (e: React.MouseEvent, panelId: string) => {
    e.stopPropagation();
    setOpenQuotePanel(prev => prev === panelId ? null : panelId);
  };

  const closeIframeView = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="candidate-dashboard-container" style={{ position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto' }}>
      {currentView === 'dashboard' && (
        <div className="app-view active screen">
          <div className="topbar">
            <div>
              <p className="greeting-eyebrow">Wednesday, 6 May</p>
              <p className="greeting">Namaste, {userData?.name?.split(' ')[0] || 'Rahul'}</p>
            </div>
            <div className="topbar-actions">
              <div className="icon-btn" aria-label="Notifications">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>
                </svg>
                <span className="dot"></span>
              </div>
              <div className="avatar-chip" onClick={() => onOpenAuth?.()} title="Account & sign-in">
                {(userData?.name || 'R')[0].toUpperCase()}
              </div>
            </div>
          </div>

          <section>
            <div className="strength-card">
              <div className="ring" style={{ '--pct': pct } as React.CSSProperties}>
                <div className="ring-inner">{pct}%</div>
              </div>
              <div className="strength-copy">
                <p className="headline">Your profile is 72% complete</p>
                <p className="sub">Add a <b>voice intro</b> and finish <b>ID verification</b> — complete profiles get replies 4.5x more often.</p>
              </div>
            </div>
          </section>

          <section>
            <div className="section-head">
              <p className="section-title">Your profile</p>
              <a className="section-link" href="#preview" onClick={(e) => {e.preventDefault(); setIsProfileModalOpen(true);}}>Preview as client</a>
            </div>

            <div className="candidate-card">
              <div className="cand-head-row">
                <div className="photo-wrap">
                  <div className="cand-photo">{(userData?.name || 'RK').substring(0,2).toUpperCase()}</div>
                  <span className="avail-badge-photo">Available Now</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cand-name-row">
                    <span className="cand-name">{userData?.name || 'Rahul Kumar'}</span>
                    <span className="verified-tick" title="Identity verified">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  </div>
                  <p className="cand-title">UI Designer & Brand Specialist</p>
                  <p className="cand-meta">
                    <span>📍 Noida, Uttar Pradesh</span><span className="sep"></span>
                    <span>🌐 Remote OK</span>
                  </p>
                </div>
                <div className="strength-chip">
                  <div className="pct">72%</div>
                  <div className="cap">Profile Strength</div>
                  <div className="bar"><span style={{ width: '72%' }}></span></div>
                </div>
              </div>

              <div className="cand-stats">
                <div className="cand-stat"><div className="num">3–5 yrs</div><div className="lbl">Experience</div></div>
                <div className="cand-stat"><div className="num">Full-time</div><div className="lbl">Availability</div></div>
                <div className="cand-stat"><div className="num">Today</div><div className="lbl">Available to start</div></div>
              </div>

              <div className="cand-block">
                <p className="lbl">Top Skills</p>
                <div className="skill-row">
                  <span className="skill-pill">Figma UI Design <span className="price">₹8,000/project</span></span>
                  <span className="skill-pill">Logo Design <span className="price">₹3,000/project</span></span>
                  <span className="skill-pill">Brand Identity <span className="price">₹12,000/project</span></span>
                </div>
              </div>

              <div className="cand-block">
                <div className="highlight-row">
                  <div className="highlight-box green"><span className="ic">💰</span><div><b>₹3,000</b><span>Starting price</span></div></div>
                  <div className="highlight-box amber"><span className="ic">🗣️</span><div><b>Hindi, English</b><span>2 Languages</span></div></div>
                </div>
              </div>

              <div className="cand-block" style={{ marginBottom: 0 }}>
                <div className="verify-list">
                  <div className="verify-item"><span className="dot"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg></span> Resume Verified</div>
                  <div className="verify-item"><span className="dot"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg></span> Mobile Verified</div>
                  <div className="verify-item"><span className="dot"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg></span> Email Verified</div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--ink-faint)', marginTop: '11px' }}>Profile updated: 2 days ago</p>
              </div>

              <div className="cand-actions" style={{ marginTop: '16px' }}>
                <button className="btn btn-ghost" onClick={() => setIsProfileModalOpen(true)}>👁️ View Profile</button>
                <button className="btn btn-whatsapp">💬 WhatsApp</button>
                <button className="btn btn-call" title="Call">📞</button>
              </div>
            </div>
          </section>

          <section>
            <div className="metrics-row">
              <div className="metric-card">
                <div className="num">128</div>
                <div className="lbl">Profile views this week</div>
                <div className="delta">↑ 18%</div>
              </div>
              <div className="metric-card">
                <div className="num">6</div>
                <div className="lbl">WhatsApp leads this week</div>
                <div className="delta">↑ 2</div>
              </div>
              <div className="metric-card">
                <div className="num">92%</div>
                <div className="lbl">Response rate</div>
                <div className="delta">Steady</div>
              </div>
            </div>
          </section>

          <section>
            <div className="section-head">
              <p className="section-title">Subscription</p>
            </div>
            <div className="plan-card">
              <div className="plan-top">
                <div>
                  <div className="plan-badge">LucoHire Pro</div>
                  <div className="plan-name">Get seen first</div>
                </div>
                <div className="plan-price">
                  <div className="amt">₹399</div>
                  <div className="per">per month</div>
                </div>
              </div>
              <p className="plan-desc">Move to the top of category search and clear your WhatsApp lead cap for the month.</p>

              <div className="plan-feats">
                <div className="plan-feat"><span className="check"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>Unlimited WhatsApp leads, no monthly cap</div>
                <div className="plan-feat"><span className="check"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>Priority placement in Design & Creative search</div>
                <div className="plan-feat"><span className="check"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>Featured verified badge on your card</div>
                <div className="plan-feat"><span className="check"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>Platform fee drops from 10% to 5%</div>
              </div>

              <div className="plan-current">
                <span>Currently on <b>Free plan</b></span>
                <span><b>2</b> of 3 leads used</span>
              </div>

              <button className="plan-cta">Upgrade to Pro</button>
            </div>
          </section>

          <section>
            <div className="section-head">
              <p className="section-title">Edit profile card</p>
              <button className="btn btn-primary" style={{ flex: 'none', padding: '8px 16px', fontSize: '12px' }}>Edit</button>
            </div>
            <div className="manage-list">

              <div className={`manage-item ${openManagePanel === 'skills' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('skills')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
                  <div className="m-body"><div className="m-title">Skills & pricing</div><div className="m-sub">{skills.length} skill{skills.length !== 1 ? 's' : ''} added</div></div>
                  <span className="status-pill done">Complete</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    {skills.map(skill => (
                      <div className="skill-card" key={skill.id}>
                        <div className="skill-card-head">
                          {skill.name ? <b>{skill.name}</b> : <input type="text" placeholder="Skill name" style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }} onChange={(e) => {
                            setSkills(skills.map(s => s.id === skill.id ? { ...s, name: e.target.value } : s));
                          }} />}
                          <button className="remove-skill" onClick={(e) => { e.stopPropagation(); setSkills(skills.filter(s => s.id !== skill.id)); }}>✕</button>
                        </div>
                        <div className="skill-grid">
                          <div className="field">
                            <label>Skill level</label>
                            <select value={skill.level} onChange={(e) => setSkills(skills.map(s => s.id === skill.id ? { ...s, level: e.target.value } : s))}>
                              <option>Expert</option><option>Fluent</option><option>Intermediate</option><option>Basic</option>
                            </select>
                          </div>
                          <div className="field">
                            <label>Experience</label>
                            <select value={skill.exp} onChange={(e) => setSkills(skills.map(s => s.id === skill.id ? { ...s, exp: e.target.value } : s))}>
                              <option>1-3 yrs</option><option>3-5 yrs</option><option>5+ yrs</option>
                            </select>
                          </div>
                          <div className="field">
                            <label>Starting price</label>
                            <div className="rate-input">
                              <span>₹</span>
                              <input type="text" value={skill.price} onChange={(e) => setSkills(skills.map(s => s.id === skill.id ? { ...s, price: e.target.value } : s))} />
                            </div>
                          </div>
                          <div className="field">
                            <label>Price type</label>
                            <select value={skill.type} onChange={(e) => setSkills(skills.map(s => s.id === skill.id ? { ...s, type: e.target.value } : s))}>
                              <option>Per project</option><option>Per hour</option><option>Per month</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button className="add-skill-btn" onClick={(e) => { e.stopPropagation(); setSkills([...skills, { id: Date.now(), name: '', level: 'Expert', exp: '3-5 yrs', price: '', type: 'Per project' }]); }}>+ Add another skill</button>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'edu' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('edu')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M22 10 12 4 2 10l10 6 10-6Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg></div>
                  <div className="m-body"><div className="m-title">Education & work experience</div><div className="m-sub">{entries.length > 0 ? entries.slice(0,2).map(e => e.title || 'Entry').join(', ') : 'Add education or experience'}</div></div>
                  <span className="status-pill done">Complete</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    {entries.map(entry => (
                      <div className="entry-card" key={entry.id}>
                        <div className="entry-grid">
                          <div className="field wide" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                            <select style={{ flex: 1 }} value={entry.type} onChange={(e) => setEntries(entries.map(ent => ent.id === entry.id ? { ...ent, type: e.target.value } : ent))}>
                              <option>Education</option><option>Work experience</option>
                            </select>
                            <button className="remove-skill" onClick={(e) => { e.stopPropagation(); setEntries(entries.filter(ent => ent.id !== entry.id)); }}>✕</button>
                          </div>
                          <div className="field">
                            <input type="text" placeholder="Degree / Role" value={entry.title} onChange={(e) => setEntries(entries.map(ent => ent.id === entry.id ? { ...ent, title: e.target.value } : ent))} />
                          </div>
                          <div className="field">
                            <input type="text" placeholder="Institution / Company" value={entry.org} onChange={(e) => setEntries(entries.map(ent => ent.id === entry.id ? { ...ent, org: e.target.value } : ent))} />
                          </div>
                          <div className="field wide">
                            <input type="text" placeholder="Year or duration" value={entry.dur} onChange={(e) => setEntries(entries.map(ent => ent.id === entry.id ? { ...ent, dur: e.target.value } : ent))} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button className="add-skill-btn" onClick={(e) => { e.stopPropagation(); setEntries([...entries, { id: Date.now(), type: 'Education', title: '', org: '', dur: '' }]); }}>+ Add another entry</button>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'certs' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('certs')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg></div>
                  <div className="m-body"><div className="m-title">Certifications & portfolio</div><div className="m-sub">{certs.length} link{certs.length !== 1 ? 's' : ''} added {certs.some(c => c.type === 'Behance') ? '· Behance connected' : ''}</div></div>
                  <span className="status-pill pending">Add more</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    {certs.map(cert => (
                      <div key={cert.id} style={{ marginBottom: '12px' }}>
                        <div className="field wide" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <select style={{ flex: 1 }} value={cert.type} onChange={(e) => setCerts(certs.map(c => c.id === cert.id ? { ...c, type: e.target.value } : c))}>
                            <option>Behance</option><option>Dribbble</option><option>Github</option>
                          </select>
                          <button className="remove-skill" onClick={(e) => { e.stopPropagation(); setCerts(certs.filter(c => c.id !== cert.id)); }}>✕</button>
                        </div>
                        <div className="field wide">
                          <input type="text" value={cert.val} placeholder="https://" onChange={(e) => setCerts(certs.map(c => c.id === cert.id ? { ...c, val: e.target.value } : c))} />
                        </div>
                      </div>
                    ))}

                    <div className="mp-line" style={{ marginTop: '4px' }}>Adding 2 more portfolio links or a certification usually lifts profile strength by another 6–8%.</div>
                    <button className="add-skill-btn" onClick={(e) => { e.stopPropagation(); setCerts([...certs, { id: Date.now(), type: 'Behance', val: '' }]); }}>+ Add certification or link</button>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'langs' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('langs')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M5 8h14M5 12h14M5 16h9"/></svg></div>
                  <div className="m-body"><div className="m-title">Languages</div><div className="m-sub">{langs.length > 0 ? langs.map(l => l.name).join(', ') : 'Add a language'}</div></div>
                  <span className="status-pill done">Complete</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    <div className="skill-grid" style={{ marginBottom: '10px' }}>
                      <select value={langSelect} onChange={e => setLangSelect(e.target.value)}><option>Hindi</option><option>English</option><option>Bengali</option><option>Marathi</option></select>
                      <select value={langLevel} onChange={e => setLangLevel(e.target.value)}><option>Basic</option><option>Fluent</option><option>Expert</option></select>
                    </div>
                    <div className="tag-box" id="langTagBox">
                      {langs.map(l => (
                        <span className="tag" key={l.id}>{l.name} · {l.level} <button onClick={(e) => { e.stopPropagation(); setLangs(langs.filter(lang => lang.id !== l.id)); }}>✕</button></span>
                      ))}
                    </div>
                    <button className="add-skill-btn" style={{ marginTop: '11px' }} onClick={(e) => { 
                      e.stopPropagation(); 
                      if(langSelect && langLevel) {
                        setLangs([...langs, { id: Date.now(), name: langSelect, level: langLevel }]);
                        setLangSelect('Hindi'); setLangLevel('Basic');
                      }
                    }}>+ Add another language</button>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'avail' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('avail')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
                  <div className="m-body"><div className="m-title">Availability & work preferences</div><div className="m-sub">Full-time · available now</div></div>
                  <span className="status-pill done">Complete</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    <div className="skill-grid" style={{ marginBottom: '10px' }}>
                      <select defaultValue="Full-time"><option>Full-time</option><option>Part-time</option><option>Weekends only</option></select>
                      <select defaultValue="Available now"><option>Available now</option><option>Within 1 week</option><option>Within 1 month</option></select>
                    </div>
                    <div className="info-card" style={{ marginBottom: '10px' }}>
                      <div className="info-card-head"><b style={{ fontSize: '12.5px' }}>Availability calendar</b></div>
                      <div className="day-pills">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                          <div 
                            key={day} 
                            className={`day-pill ${availDays.includes(day) ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if(availDays.includes(day)) {
                                setAvailDays(availDays.filter(d => d !== day));
                              } else {
                                setAvailDays([...availDays, day]);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >{day}</div>
                        ))}
                      </div>
                      <div className="time-row">
                        <select defaultValue="10:00 AM"><option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option></select>
                        <span className="to">to</span>
                        <select defaultValue="6:00 PM"><option>5:00 PM</option><option>6:00 PM</option><option>7:00 PM</option></select>
                      </div>
                    </div>
                    <div className="mp-line" style={{ marginBottom: 0 }}>Preferred project size: ₹3,000 – ₹15,000</div>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'intro' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('intro')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/></svg></div>
                  <div className="m-body"><div className="m-title">Voice & video intro</div><div className="m-sub">Adds about 8% to your profile strength</div></div>
                  <span className="status-pill pending">Not added</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    <div className="skill-grid">
                      <div className="upload-box"><div>🎙️</div><p>7s Voice intro</p><p className="small">Hold to record</p></div>
                      <div className="upload-box"><div>🎥</div><p>15s Video intro</p><p className="small">Tap to upload</p></div>
                    </div>
                    <div className="mp-line" style={{ marginTop: '10px' }}>Clients reply about 40% more often when a voice or video intro is added.</div>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'resume' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('resume')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg></div>
                  <div className="m-body"><div className="m-title">Resume</div><div className="m-sub">rahul_kumar_resume.pdf</div></div>
                  <span className="status-pill done">Uploaded</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    <div className="upload-box done" onClick={(e) => e.stopPropagation()}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3v5a1 1 0 0 0 1 1h5"/><path d="M6 21h12a1 1 0 0 0 1-1V7l-5-5H6a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1z"/></svg>
                      <p>rahul_kumar_resume.pdf</p>
                      <p className="small">Tap to replace</p>
                    </div>
                    <div className="mp-line" style={{ marginTop: '10px', marginBottom: 0 }}>Want to know how this resume actually performs? <a className="mp-link" onClick={(e) => { e.stopPropagation(); onOpenResumeCheck?.(); }}>Open Resume Journey →</a></div>
                  </div>
                </div>
              </div>

              <div className={`manage-item ${openManagePanel === 'idverify' ? 'open' : ''}`}>
                <div className="manage-row" onClick={() => toggleManage('idverify')}>
                  <div className="m-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/></svg></div>
                  <div className="m-body"><div className="m-title">ID verification</div><div className="m-sub">Adds about 12% and the verified tick</div></div>
                  <span className="status-pill pending">Pending</span>
                  <svg className="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BA0A6" strokeWidth="1.8"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="manage-panel">
                  <div className="manage-panel-inner">
                    <div className="field">
                      <label>Government ID number</label>
                      <div className="verify-row">
                        <input type="text" placeholder="Aadhaar / PAN number" />
                        <button className="mp-btn" onClick={(e) => e.stopPropagation()}>Verify</button>
                      </div>
                    </div>
                    <div className="upload-box" onClick={(e) => e.stopPropagation()}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/></svg>
                      <p>Upload ID photo</p>
                      <p className="small">Aadhaar, PAN, or Passport</p>
                    </div>
                    <div className="mp-line" style={{ marginTop: '10px', marginBottom: 0 }}>Verify to get the blue tick and a <b>12% strength boost</b> — verified profiles get replies 4.5x more often.</div>
                  </div>
                </div>
              </div>

            </div>
            <div className="footer-space"></div>
          </section>

          <section>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setResumeConverted(true)}>
              {resumeConverted ? '✓ Converted to resume' : '📝 Convert my details into resume'}
            </button>
            {resumeConverted && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }}>⬇️ Download</button>
                <button className="btn btn-ghost" style={{ flex: 1 }}>🔗 Share</button>
              </div>
            )}
            <div className="footer-space"></div>
          </section>
        </div>
      )}

      {currentView === 'leads' && (
        <div className="app-view active screen">
          <div className="topbar">
            <div>
              <p className="greeting-eyebrow">Wednesday, 6 May</p>
              <p className="greeting">Your leads</p>
            </div>
            <div className="topbar-actions">
              <div className="icon-btn" aria-label="Notifications">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5B6168" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
                <span className="dot"></span>
              </div>
              <div className="avatar-chip" onClick={() => onOpenAuth?.()} title="Account & sign-in">{(userData?.name || 'R')[0].toUpperCase()}</div>
            </div>
          </div>

          <section>
            <div className="leads-hero">
              <div className="lh-top">
                <div>
                  <div className="lh-num">6</div>
                  <div className="lh-lbl">WhatsApp leads this week</div>
                </div>
                <div className="lh-cap">2 of 3 used on Free</div>
              </div>
              <div className="lh-progress">
                <div className="lh-progress-track"><div className="lh-progress-fill" style={{ width: '67%' }}></div></div>
                <div className="lh-progress-note">1 lead left this week · resets in 3 days · <a href="#pro" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>go unlimited</a></div>
              </div>
              <div className="lh-mini-stats">
                <div className="lh-mini-stat"><div className="v">92%</div><div className="k">Response rate</div></div>
                <div className="lh-mini-stat"><div className="v">1</div><div className="k">Won this week</div></div>
                <div className="lh-mini-stat"><div className="v">12m</div><div className="k">Avg. reply time</div></div>
              </div>
              <div className="lh-by-skill">
                <span className="lh-skill-chip"><b>3</b> Figma UI Design</span>
                <span className="lh-skill-chip"><b>2</b> Logo Design</span>
                <span className="lh-skill-chip"><b>1</b> Brand Identity</span>
              </div>
            </div>
          </section>

          <section style={{ marginTop: '18px' }}>
            <p className="filter-label">Filter by skill — you're registered for 3</p>
            <div className="lead-filters" style={{ marginBottom: '16px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {['All skills', 'Figma UI Design', 'Logo Design', 'Brand Identity'].map(f => (
                <div key={f} className={`skill-filter ${skillFilter === f ? 'active' : ''}`} onClick={() => setSkillFilter(f)} style={{ cursor: 'pointer' }}>{f}</div>
              ))}
            </div>
            <p className="filter-label">Filter by status</p>
            <div className="lead-filters" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
              {['All · 6', 'New · 2', 'Replied · 3', 'Won · 1'].map(f => (
                <div key={f} className={`lead-filter ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)} style={{ cursor: 'pointer' }}>{f}</div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: '14px' }}>
            {[
              {
                id: 'q1',
                chips: ['🎯 Logo Design', '🎯 Brand Identity'],
                avatar: 'P',
                name: 'Priya Malhotra',
                time: '12 min ago',
                brief: 'Needs a logo + basic brand kit for a new D2C skincare label, launching next month.',
                budget: '💰 Offered ₹12,000',
                timeline: '⏱ needed within 10 days',
                status: 'New',
                statusClass: 'new'
              },
              {
                id: 'q2',
                chips: ['🎯 Figma UI Design'],
                avatar: 'A',
                name: 'Arjun Studios',
                time: '2 hr ago',
                brief: 'Looking for ongoing Figma support, roughly 10 hrs/week for an internal dashboard product.',
                budget: '💰 Offered ₹8,000/project',
                timeline: '⏱ needed within 5 days',
                status: 'New',
                statusClass: 'new'
              },
              {
                id: 'q3',
                chips: ['🎯 Figma UI Design'],
                avatar: 'S',
                name: 'Simran Kaur',
                time: 'Yesterday',
                brief: 'Wants a full UI redesign for a booking app — sent over a Notion doc with references.',
                budget: '💰 Offered ₹25,000',
                timeline: '⏱ needed within 15 days',
                status: 'Replied',
                statusClass: 'replied',
                extraQuote: "You quoted: ₹27,000 - 12 days — waiting on Simran's reply"
              },
              {
                id: 'q4',
                chips: ['🎯 Logo Design'],
                avatar: 'N',
                name: 'Nimbus Foods',
                time: '3 days ago',
                brief: 'Packaging design for 4 SKUs — confirmed and advance paid.',
                budget: '💰 Agreed ₹18,000 - paid',
                timeline: '',
                status: 'Won',
                statusClass: 'won'
              }
            ].map((lead) => (
              <div className="lead-card" key={lead.id} style={{ marginBottom: '14px' }}>
                <div className="lead-match-row">
                  {lead.chips.map(c => <span key={c} className="lead-match-chip">{c}</span>)}
                </div>
                <div className="lead-top">
                  <div className="lead-avatar">{lead.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="lead-name-row"><span className="lead-name">{lead.name}</span><span className="lead-time">{lead.time}</span></div>
                    <p className="lead-brief">{lead.brief}</p>
                  </div>
                </div>
                <div className="lead-meta-row">
                  <span className="lead-budget">{lead.budget}</span>
                  {lead.timeline && <span className="lead-timeline">{lead.timeline}</span>}
                  <span className={`lead-status ${lead.statusClass}`}>{lead.status}</span>
                </div>
                
                {lead.extraQuote && (
                  <div style={{ fontSize: '13px', color: 'var(--ink-light)', marginBottom: '14px', padding: '10px', background: '#F8F9FA', borderRadius: '8px' }}>
                    {lead.extraQuote}
                  </div>
                )}
                
                <div className="lead-actions">
                  <button className="btn btn-whatsapp">💬 Chat</button>
                  <button className="btn btn-quote" onClick={(e) => toggleQuote(e, lead.id)}>💰 Send my quote</button>
                  <button className="btn btn-call" title="Request a call">📞</button>
                </div>
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: '8px' }}>View project</button>
                
                {sentQuotes.includes(lead.id) && (
                  <div style={{ marginTop: '12px', background: '#eaf8f0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✓ Quote sent — {lead.name.split(' ')[0]} will see it on WhatsApp
                  </div>
                )}
                
                <div className={`quote-panel ${openQuotePanel === lead.id ? 'open' : ''}`}>
                  <div className="quote-inner">
                    <div className="quote-fields">
                      <div className="quote-field">
                        <label>Your price</label>
                        <input type="text" placeholder="₹ 14,000" />
                      </div>
                      <div className="quote-field">
                        <label>Your timeline</label>
                        <select>
                          <option>Same as asked — 10 days</option>
                          <option>7 days</option>
                          <option>14 days</option>
                          <option>Custom</option>
                        </select>
                      </div>
                    </div>
                    <div className="quote-note">
                      <textarea placeholder="Optional note — e.g. what's included, or why the price differs"></textarea>
                    </div>
                    <div className="quote-submit-row">
                      <span className="quote-accept-link">Accept as-is instead</span>
                      <button className="btn btn-primary" onClick={() => {
                        setOpenQuotePanel(null);
                        if (!sentQuotes.includes(lead.id)) {
                          setSentQuotes([...sentQuotes, lead.id]);
                        }
                      }}>Send quote</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="footer-space"></div>
          </section>
        </div>
      )}

      {(currentView === 'dashboard' || currentView === 'leads') && (
        <div className="bottom-nav">
          <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
            Dashboard{currentView === 'dashboard' && <span className="nav-dot"></span>}
          </div>
          <div className={`nav-item ${currentView === 'leads' ? 'active' : ''}`} onClick={() => setCurrentView('leads')}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4H12a8.7 8.7 0 0 1-4-1L3 20l1.2-3.6a8.3 8.3 0 0 1-1.2-4.4A8.4 8.4 0 0 1 11.5 3h.5a8.4 8.4 0 0 1 8.4 8Z"/></svg>
            Leads{currentView === 'leads' && <span className="nav-dot"></span>}
          </div>
          <div className="nav-item" onClick={() => onOpenResumeCheck?.()}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>
            Resume Journey
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      <div className={`profile-modal ${isProfileModalOpen ? 'open' : ''}`} onClick={() => setIsProfileModalOpen(false)}>
        <div className="profile-modal-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="profile-modal-close" onClick={() => setIsProfileModalOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </div>
          <p className="profile-modal-tag">Your profile — as clients see it</p>

          <div className="candidate-card">
            <div className="cand-head-row">
              <div className="photo-wrap">
                <div className="cand-photo">{(userData?.name || 'RK').substring(0,2).toUpperCase()}</div>
                <span className="avail-badge-photo">Available Now</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cand-name-row">
                  <span className="cand-name">{userData?.name || 'Rahul Kumar'}</span>
                  <span className="verified-tick" title="Identity verified">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                </div>
                <p className="cand-title">UI Designer & Brand Specialist</p>
                <p className="cand-meta">
                  <span>📍 Noida, Uttar Pradesh</span><span className="sep"></span>
                  <span>🌐 Remote OK</span>
                </p>
              </div>
              <div className="strength-chip">
                <div className="pct">72%</div>
                <div className="cap">Profile Strength</div>
                <div className="bar"><span style={{ width: '72%' }}></span></div>
              </div>
            </div>

            <div className="cand-stats">
              <div className="cand-stat"><div className="num">3–5 yrs</div><div className="lbl">Experience</div></div>
              <div className="cand-stat"><div className="num">Full-time</div><div className="lbl">Availability</div></div>
              <div className="cand-stat"><div className="num">Today</div><div className="lbl">Available to start</div></div>
            </div>

            <div className="cand-block">
              <p className="lbl">About</p>
              <p className="about-text">Helps early-stage brands look credible, fast — 80+ logo and UI projects delivered for founders and small teams across India.</p>
            </div>

            <div className="cand-block">
              <p className="lbl">Top Skills</p>
              <div className="skill-row">
                <span className="skill-pill">Figma UI Design <span className="price">₹8,000/project</span></span>
                <span className="skill-pill">Logo Design <span className="price">₹3,000/project</span></span>
                <span className="skill-pill">Brand Identity <span className="price">₹12,000/project</span></span>
              </div>
            </div>

            <div className="cand-actions" style={{ marginTop: '16px' }}>
              <button className="btn btn-whatsapp">💬 WhatsApp</button>
              <button className="btn btn-call" title="Call">📞</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
