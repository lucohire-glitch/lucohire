/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import LucoLogo from './LucoLogo';

interface CandidateRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  onSwitchToRecruiter: () => void;
}

export default function CandidateRegistration({
  isOpen,
  onClose,
  onComplete,
  onSwitchToRecruiter
}: CandidateRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const stepLabels: Record<number, string> = {
    1: 'Basic details',
    2: 'Skills & pricing',
    3: 'Professional proof',
    4: 'Work preferences'
  };

  // Step 1 Form Fields
  const [hasPhoto, setHasPhoto] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '']);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [travelRadius, setTravelRadius] = useState(80);
  const [category, setCategory] = useState('');
  const [experience, setExperience] = useState('3–5 years');

  // Resume upload in Step 1
  const [resumeParsed, setResumeParsed] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeSkipped, setResumeSkipped] = useState(false);
  const [parsingActive, setParsingActive] = useState(false);

  // Step 2: Skills
  const [skills, setSkills] = useState([
    {
      id: 1,
      name: 'Logo Design',
      customName: '',
      level: 'Expert',
      exp: '5+ yrs',
      price: '',
      priceType: 'Per project',
      proofUploaded: false,
      link: '',
      isHeadline: true
    },
    {
      id: 2,
      name: 'Figma UI Design',
      customName: '',
      level: 'Expert',
      exp: '3–5 yrs',
      price: '',
      priceType: 'Per project',
      proofUploaded: false,
      link: '',
      isHeadline: false
    }
  ]);

  // Step 3: Professional Proof
  const [about, setAbout] = useState('');
  const [achievement, setAchievement] = useState('');
  const [eduWorkList, setEduWorkList] = useState([
    { id: 1, type: 'Education', title: '', org: '', year: '' }
  ]);
  const [linksList, setLinksList] = useState([
    { id: 1, platform: 'Certification', customPlatform: '', link: '', isUploaded: false }
  ]);
  const [resumeUploadedStep3, setResumeUploadedStep3] = useState(false);

  // Step 4: Work Preferences
  const [languages, setLanguages] = useState([
    { lang: 'Hindi', level: 'Expert' },
    { lang: 'English', level: 'Fluent' }
  ]);
  const [newLang, setNewLang] = useState('Hindi');
  const [newLangLevel, setNewLangLevel] = useState('Basic');
  const [availType, setAvailType] = useState('Full-time');
  const [availStart, setAvailStart] = useState('Available now');
  const [calAvailOn, setCalAvailOn] = useState(true);
  const [activeDays, setActiveDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [calFrom, setCalFrom] = useState('10:00 AM');
  const [calTo, setCalTo] = useState('6:00 PM');
  const [preferredDuration, setPreferredDuration] = useState('Any duration');
  const [waOn, setWaOn] = useState(true);
  const [waFrom, setWaFrom] = useState('10:00 AM');
  const [waTo, setWaTo] = useState('7:00 PM');
  const [consentCheck, setConsentCheck] = useState(false);
  const [activeMediums, setActiveMediums] = useState<string[]>(['whatsapp']);
  const [voiceIntro, setVoiceIntro] = useState(false);
  const [videoIntro, setVideoIntro] = useState(false);
  const [idVerifyOn, setIdVerifyOn] = useState(false);
  const [idDocType, setIdDocType] = useState('');
  const [idDocUploaded, setIdDocUploaded] = useState(false);
  const [tncCheck, setTncCheck] = useState(false);

  // Score toast state
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1400);
  };

  // Profile Score calculation
  let score = 0;
  if (hasPhoto) score += 5;
  if (name.trim()) score += 4;
  if (title.trim()) score += 3;
  if (mobileVerified) score += 9;
  if (emailVerified) score += 5;
  if (city.trim() && state.trim()) score += 5;
  if (category) score += 2;
  score += 2; // experience default filled (2%)

  const hasPricedSkill = skills.some((s) => s.price.trim().length > 0);
  if (hasPricedSkill) score += 12;

  const hasProof = skills.some((s) => s.proofUploaded || s.link.trim().length > 0);
  if (hasProof) score += 8;

  if (about.trim()) score += 5;
  if (achievement.trim()) score += 3;

  const hasEduWork = eduWorkList.some((e) => e.title.trim() || e.org.trim() || e.year.trim());
  if (hasEduWork) score += 8;

  const hasLinks = linksList.some((l) => l.link.trim() || l.isUploaded || l.customPlatform.trim());
  if (hasLinks) score += 8;

  if (resumeUploadedStep3 || resumeParsed) score += 6;

  score += 3; // languages default filled (3%)
  score += 2; // availability default filled (2%)
  score += 2; // duration default filled (2%)

  if (waOn) score += 3;
  if (consentCheck && activeMediums.length > 0) score += 3;
  if (idDocUploaded) score += 8;
  if (voiceIntro) score += 4;
  if (videoIntro) score += 4;

  score = Math.min(100, Math.max(12, score));

  // Resume parse simulation
  const handleResumeDrop = () => {
    setParsingActive(true);
    setTimeout(() => {
      setParsingActive(false);
      setResumeParsed(true);
      setResumeFileName('Resume_Priya_Sharma.pdf');
      setName('Priya Sharma');
      setTitle('UI Designer & Brand Specialist');
      setCity('Noida');
      setState('Uttar Pradesh');
      setCategory('Design & Creative');
      setExperience('3–5 years');
      triggerToast('+15% profile score');
    }, 700);
  };

  const handleConfirmOtp = (type: 'mobile' | 'email') => {
    if (type === 'mobile') {
      setShowMobileOtp(false);
      setMobileVerified(true);
      triggerToast('+9% profile score');
    } else {
      setShowEmailOtp(false);
      setEmailVerified(true);
      triggerToast('+5% profile score');
    }
  };

  const addSkill = () => {
    setSkills([
      ...skills,
      {
        id: Date.now(),
        name: 'Web Development',
        customName: '',
        level: 'Intermediate',
        exp: '1–3 yrs',
        price: '',
        priceType: 'Per project',
        proofUploaded: false,
        link: '',
        isHeadline: false
      }
    ]);
  };

  const addEduWork = () => {
    setEduWorkList([
      ...eduWorkList,
      { id: Date.now(), type: 'Education', title: '', org: '', year: '' }
    ]);
  };

  const addLinkEntry = () => {
    setLinksList([
      ...linksList,
      { id: Date.now(), platform: 'Portfolio website', customPlatform: '', link: '', isUploaded: false }
    ]);
  };

  const addLangTag = () => {
    if (!languages.some((l) => l.lang === newLang)) {
      setLanguages([...languages, { lang: newLang, level: newLangLevel }]);
      triggerToast('+3% profile score');
    }
  };

  const removeLangTag = (langName: string) => {
    setLanguages(languages.filter((l) => l.lang !== langName));
  };

  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
  };

  const toggleMedium = (m: string) => {
    if (activeMediums.includes(m)) {
      setActiveMediums(activeMediums.filter((item) => item !== m));
    } else {
      setActiveMediums([...activeMediums, m]);
    }
  };

  const headlineSkill = skills.find((s) => s.isHeadline) || skills[0];

  const handleFinish = () => {
    if (!tncCheck) return;
    const finalData = {
      name: name || 'Rahul Kumar',
      title: title || 'UI Designer & Brand Specialist',
      city: city || 'Noida',
      state: state || 'Uttar Pradesh',
      score,
      headlineSkill: headlineSkill?.name === 'other' ? (headlineSkill.customName || 'Freelancer') : (headlineSkill?.name || 'Logo Design'),
      startingRate: headlineSkill?.price ? `₹${headlineSkill.price}` : '₹3,000',
      whatsapp: mobile || '9876543210'
    };
    onComplete(finalData);
  };

  const avatarInitials = name.trim()
    ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'RK';

  return (
    <div id="registrationScreen">
      {showToast && <div className="score-toast show">{toastMsg}</div>}
      <div className="shell">
        <button className="reg-close" onClick={onClose} aria-label="Close and go back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <header className="wizard-header">
          <div className="brand-row">
            <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #E5E7EB', flexShrink: 0 }}>
                <LucoLogo size={20} />
              </div>
              <p className="brand-title">LucoHire</p>
            </div>
            <div className="score-pill">
              <div className="score-ring" id="scoreRing" style={{ '--pct': score } as any}>
                <span id="scoreNum">{score}</span>
              </div>
              <div className="score-txt">profile <b id="scoreLine">{score}%</b> ready</div>
            </div>
          </div>

          <div className="steps">
            <div className="step-track"><span style={{ width: currentStep >= 1 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: currentStep >= 2 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: currentStep >= 3 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: currentStep >= 4 ? '100%' : '0%' }}></span></div>
          </div>

          <div className="step-meta">
            <span>step <b id="stepNum">{currentStep}</b> of 4</span>
            <span id="stepLabel">{stepLabels[currentStep]}</span>
          </div>

          <p className="switch-role-link">
            Hiring instead?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); onSwitchToRecruiter(); }}>
              Switch to Recruiter sign up →
            </a>
          </p>
        </header>

        <main className="wizard-main">
          {/* STEP 1 : BASIC DETAILS */}
          {currentStep === 1 && (
            <section className="panel active" data-panel="1">
              <h1 className="title">Create your freelancer profile</h1>
              <p className="sub-title">Register free and let clients discover your skills, experience and availability.</p>

              <div className="card-block resume-card" id="resumeUploadCard">
                <div className="card-head-row">
                  <div className="left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                    Upload your resume — we'll fill the form for you
                  </div>
                  <span className="smart-badge">Recommended</span>
                </div>

                {!resumeSkipped ? (
                  <div id="resumeUploadBody">
                    {!resumeParsed ? (
                      <div className="resume-dropzone" id="resumeDropzone" tabIndex={0} role="button" onClick={handleResumeDrop}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
                          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                        </svg>
                        <p className="rd-title">Drag &amp; drop your resume, or <span className="rd-browse">browse</span></p>
                        <p className="rd-hint">PDF or Word — we'll auto-fill your name, title, location, category &amp; experience below</p>
                      </div>
                    ) : (
                      <>
                        <div className="resume-file-chip" id="resumeFileChip">
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                          <span id="resumeFileName">{resumeFileName}</span>
                          <button type="button" id="resumeFileRemove" onClick={() => setResumeParsed(false)}>✕</button>
                        </div>
                        <div className="resume-parsed-banner" id="resumeParsedBanner">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12" /></svg>
                          <span><b>5 fields auto-filled</b> from your resume — just review and edit anything below that isn't quite right.</span>
                        </div>
                      </>
                    )}
                    {parsingActive && (
                      <div className="resume-parsing" id="resumeParsing">
                        <div className="spinner-sm"></div><span id="resumeParsingLabel">Reading your resume...</span>
                      </div>
                    )}
                    <p className="skip-link" id="resumeSkipLink" onClick={() => setResumeSkipped(true)}>Skip, I'll fill in the details myself →</p>
                  </div>
                ) : (
                  <div className="resume-skipped-note" id="resumeSkippedNote">
                    <span>No problem — fill in the fields below yourself.</span>
                    <a id="resumeUndoSkip" onClick={() => setResumeSkipped(false)}>Upload resume instead</a>
                  </div>
                )}
              </div>

              <div className="photo-row">
                <div
                  className={`photo-circle ${hasPhoto ? 'done' : ''}`}
                  id="photoUpload"
                  onClick={() => {
                    const next = !hasPhoto;
                    setHasPhoto(next);
                    if (next) triggerToast('+5% profile score');
                  }}
                >
                  {hasPhoto ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 8a2 2 0 0 1 2-2h1l1-2h8l1 2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  )}
                </div>
                <div className="txt">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p className="t1">Add profile photo</p>
                    <span className="pts" id="pts-photo">{hasPhoto ? 'added ✓' : '+5%'}</span>
                  </div>
                  <p className="t2">A clear photo helps clients trust your profile</p>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Full name</label><span className="pts" id="pts-name">{name.trim() ? 'added ✓' : '+4%'}</span></div>
                <input
                  type="text"
                  id="nameInput"
                  placeholder="e.g. Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="field-label"><label>Professional title</label><span className="pts" id="pts-title">{title.trim() ? 'added ✓' : '+3%'}</span></div>
                <input
                  type="text"
                  id="titleInput"
                  placeholder="e.g. UI Designer & Brand Specialist"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="hint">This appears directly below your name.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Mobile number</label><span className="pts" id="pts-mobileVerified">{mobileVerified ? 'added ✓' : '+9%'}</span></div>
                {!mobileVerified ? (
                  <>
                    <div className="verify-row" id="mobileVerifyRow">
                      <input
                        type="tel"
                        id="mobileInput"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                      />
                      <button
                        className="verify-btn"
                        id="mobileSendBtn"
                        disabled={mobile.trim().length !== 10}
                        onClick={() => setShowMobileOtp(true)}
                      >
                        Send OTP
                      </button>
                    </div>
                    {showMobileOtp && (
                      <div className="otp-box show" id="mobileOtpBox">
                        <p className="lbl">Enter the 4-digit OTP sent to your phone</p>
                        <div className="otp-inputs" id="mobileOtpInputs">
                          {[0, 1, 2, 3].map((idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength={1}
                              inputMode="numeric"
                              value={mobileOtp[idx]}
                              onChange={(e) => {
                                const next = [...mobileOtp];
                                next[idx] = e.target.value;
                                setMobileOtp(next);
                              }}
                            />
                          ))}
                        </div>
                        <div className="otp-actions">
                          <button onClick={() => handleConfirmOtp('mobile')}>Confirm</button>
                          <span onClick={() => triggerToast('OTP resent to mobile!')}>Resend OTP</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="verified-chip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                    {mobile} verified
                  </div>
                )}
              </div>

              <div className="field">
                <div className="field-label"><label>Email address</label><span className="pts" id="pts-emailVerified">{emailVerified ? 'added ✓' : '+5%'}</span></div>
                {!emailVerified ? (
                  <>
                    <div className="verify-row" id="emailVerifyRow">
                      <input
                        type="email"
                        id="emailInput"
                        placeholder="e.g. rahul@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button
                        className="verify-btn"
                        id="emailSendBtn"
                        disabled={!(email.includes('@') && email.includes('.'))}
                        onClick={() => setShowEmailOtp(true)}
                      >
                        Send OTP
                      </button>
                    </div>
                    {showEmailOtp && (
                      <div className="otp-box show" id="emailOtpBox">
                        <p className="lbl">Enter the 4-digit OTP sent to your email</p>
                        <div className="otp-inputs" id="emailOtpInputs">
                          {[0, 1, 2, 3].map((idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength={1}
                              inputMode="numeric"
                              value={emailOtp[idx]}
                              onChange={(e) => {
                                const next = [...emailOtp];
                                next[idx] = e.target.value;
                                setEmailOtp(next);
                              }}
                            />
                          ))}
                        </div>
                        <div className="otp-actions">
                          <button onClick={() => handleConfirmOtp('email')}>Confirm</button>
                          <span onClick={() => triggerToast('OTP resent to email!')}>Resend OTP</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="verified-chip">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                    {email} verified
                  </div>
                )}
              </div>

              {/* Location & travel radius card */}
              <div className="card-block">
                <div className="card-head-row">
                  <div className="left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                    Location &amp; travel radius
                  </div>
                  <span className="smart-badge">Smart filter</span>
                </div>
                <div className="two-col" style={{ marginBottom: '18px' }}>
                  <div>
                    <span className="mini-label">City</span>
                    <input type="text" id="cityInput" placeholder="e.g. Noida" value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div>
                    <span className="mini-label">State</span>
                    <input type="text" id="stateInput" placeholder="e.g. Uttar Pradesh" value={state} onChange={(e) => setState(e.target.value)} />
                  </div>
                </div>

                <div className="range-head">
                  <span>Willing to travel</span>
                  <span className="range-val-pill" id="rangeValPill">{travelRadius} km</span>
                </div>
                <input type="range" id="travelRange" min="0" max="100" value={travelRadius} onChange={(e) => setTravelRadius(Number(e.target.value))} />
                <div className="range-labels">
                  <span>0 km (Remote only)</span>
                  <span>100 km</span>
                </div>
                <div className="preview-line">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                  <span>Preview: <b id="locPreview">{city || 'Your city'} +{travelRadius}km</b> — nearby clients will see you at the top.</span>
                </div>
              </div>

              <div className="field-label" style={{ marginTop: '-14px', marginBottom: '20px' }}>
                <span></span><span className="pts" id="pts-location">{city && state ? 'added ✓' : '+5%'}</span>
              </div>

              <div className="field">
                <div className="field-label"><label>Primary work category</label><span className="pts" id="pts-category">{category ? 'added ✓' : '+2%'}</span></div>
                <select id="categorySelect" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select a category</option>
                  <option>Design &amp; Creative</option><option>Development &amp; Technology</option>
                  <option>Writing &amp; Translation</option><option>Marketing &amp; Sales</option>
                  <option>Teaching &amp; Training</option><option>Music &amp; Performing Arts</option>
                  <option>Business &amp; Professional Services</option><option>Home &amp; Local Services</option>
                </select>
              </div>

              <div className="field" style={{ marginBottom: 0 }}>
                <div className="field-label">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label>Total experience</label><span className="smart-badge" style={{ padding: '3px 10px', fontSize: '10.5px' }}>Smart filter</span>
                  </div>
                  <span className="pts done" id="pts-experience">✓ added</span>
                </div>
                <select id="experienceSelect" value={experience} onChange={(e) => setExperience(e.target.value)}>
                  <option>0–1 year</option>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>5+ years</option>
                </select>
                <p className="hint">Clients can filter freelancers by this experience range.</p>
              </div>
            </section>
          )}

          {/* STEP 2 : SKILLS */}
          {currentStep === 2 && (
            <section className="panel active" data-panel="2">
              <h1 className="title">Add your skills</h1>
              <p className="sub-title">Pick each service from the list, set pricing, and attach proof so clients trust it faster.</p>

              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: 'var(--ink-faint)' }}>Skills &amp; pricing</label>
                <span className="pts" id="pts-skills">{hasPricedSkill ? 'added ✓' : '+12%'}</span>
              </div>

              <div id="skillList">
                {skills.map((sk, idx) => (
                  <div key={sk.id} className="skill-card">
                    <div className="skill-card-head">
                      <select
                        value={sk.name}
                        onChange={(e) => {
                          const next = [...skills];
                          next[idx].name = e.target.value;
                          setSkills(next);
                        }}
                      >
                        <option>Logo Design</option>
                        <option>Figma UI Design</option>
                        <option>Web Development</option>
                        <option>Content Writing</option>
                        <option>Video Editing</option>
                        <option>Social Media Marketing</option>
                        <option>Photography</option>
                        <option>Voiceover</option>
                        <option value="other">Other — write your own</option>
                      </select>
                      {skills.length > 1 && (
                        <button className="remove-skill" onClick={() => setSkills(skills.filter((s) => s.id !== sk.id))}>✕</button>
                      )}
                    </div>

                    {sk.name === 'other' && (
                      <input
                        type="text"
                        className="skill-other-input"
                        placeholder="Type your skill name"
                        value={sk.customName}
                        onChange={(e) => {
                          const next = [...skills];
                          next[idx].customName = e.target.value;
                          setSkills(next);
                        }}
                      />
                    )}

                    <div className="skill-grid">
                      <div>
                        <span className="mini-label">Skill level</span>
                        <select
                          value={sk.level}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].level = e.target.value;
                            setSkills(next);
                          }}
                        >
                          <option>Expert</option><option>Intermediate</option><option>Beginner</option>
                        </select>
                      </div>
                      <div>
                        <span className="mini-label">Experience</span>
                        <select
                          value={sk.exp}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].exp = e.target.value;
                            setSkills(next);
                          }}
                        >
                          <option>5+ yrs</option><option>3–5 yrs</option><option>1–3 yrs</option><option>&lt;1 yr</option>
                        </select>
                      </div>
                      <div>
                        <span className="mini-label">Starting price</span>
                        <div className="rate-input">
                          <span>₹</span>
                          <input
                            type="number"
                            placeholder="Amount"
                            value={sk.price}
                            onChange={(e) => {
                              const next = [...skills];
                              next[idx].price = e.target.value;
                              setSkills(next);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className="mini-label">Price type</span>
                        <select
                          value={sk.priceType}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].priceType = e.target.value;
                            setSkills(next);
                          }}
                        >
                          <option>Per project</option><option>Per hour</option><option>Per day</option><option>Negotiable</option>
                        </select>
                      </div>
                    </div>

                    <div className="skill-proof">
                      <span className="proof-title">SUPPORTING PROOF FOR THIS SKILL</span>
                      <div className="skill-proof-grid">
                        <div
                          className={`mini-upload ${sk.proofUploaded ? 'done' : ''}`}
                          onClick={() => {
                            const next = [...skills];
                            next[idx].proofUploaded = !next[idx].proofUploaded;
                            setSkills(next);
                            triggerToast('+8% profile score');
                          }}
                        >
                          {sk.proofUploaded ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                              <span>Uploaded</span>
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 15V3m0 0l-4 4m4-4l4 4" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
                              <span>Upload photo/doc</span>
                            </>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Paste a link (optional)"
                          value={sk.link}
                          onChange={(e) => {
                            const next = [...skills];
                            next[idx].link = e.target.value;
                            setSkills(next);
                          }}
                        />
                      </div>
                    </div>

                    <div className="headline-row">
                      <input
                        type="checkbox"
                        checked={sk.isHeadline}
                        onChange={() => {
                          setSkills(skills.map((s) => ({ ...s, isHeadline: s.id === sk.id })));
                        }}
                      />
                      <span>Show this as my <b>main headline skill</b> on my profile card</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="add-skill-btn" onClick={addSkill}>+ Add another skill</button>
              <p className="hint" style={{ marginBottom: '6px' }}>Add every service you can confidently offer. Each skill can have its own rate and proof.</p>

              <div style={{ textTransform: 'none', textAlign: 'right' }}>
                <span className="pts" id="pts-skillProof">{hasProof ? 'added ✓' : '+8%'}</span>
              </div>
            </section>
          )}

          {/* STEP 3 : PROFESSIONAL PROOF */}
          {currentStep === 3 && (
            <section className="panel active" data-panel="3">
              <h1 className="title">Show your best work</h1>
              <p className="sub-title">A strong introduction and proof of work help clients shortlist you faster.</p>

              <div className="field">
                <div className="field-label"><label>About you</label><span className="pts" id="pts-about">{about.trim() ? 'added ✓' : '+5%'}</span></div>
                <textarea
                  placeholder="Briefly describe your experience and the work you do..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                />
              </div>

              <div className="field">
                <div className="field-label"><label>Key achievement</label><span className="pts" id="pts-achievement">{achievement.trim() ? 'added ✓' : '+3%'}</span></div>
                <input
                  type="text"
                  placeholder="e.g. Completed 80+ projects for 25 clients"
                  value={achievement}
                  onChange={(e) => setAchievement(e.target.value)}
                />
              </div>

              {/* Education & work experience */}
              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label>Education &amp; work experience</label>
                <span className="pts" id="pts-eduwork">{hasEduWork ? 'added ✓' : '+8%'}</span>
              </div>

              <div id="eduWorkList">
                {eduWorkList.map((ew, idx) => (
                  <div key={ew.id} className="entry-card">
                    <div className="entry-card-head">
                      <select
                        value={ew.type}
                        onChange={(e) => {
                          const next = [...eduWorkList];
                          next[idx].type = e.target.value;
                          setEduWorkList(next);
                        }}
                      >
                        <option>Education</option>
                        <option>Work experience</option>
                      </select>
                      {eduWorkList.length > 1 && (
                        <button className="remove-skill" onClick={() => setEduWorkList(eduWorkList.filter((item) => item.id !== ew.id))}>✕</button>
                      )}
                    </div>
                    <div className="entry-grid">
                      <input
                        type="text"
                        placeholder="Degree / Role — e.g. B.Des"
                        value={ew.title}
                        onChange={(e) => {
                          const next = [...eduWorkList];
                          next[idx].title = e.target.value;
                          setEduWorkList(next);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Institution / Company"
                        value={ew.org}
                        onChange={(e) => {
                          const next = [...eduWorkList];
                          next[idx].org = e.target.value;
                          setEduWorkList(next);
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Year or duration — e.g. 2018–2020"
                      value={ew.year}
                      onChange={(e) => {
                        const next = [...eduWorkList];
                        next[idx].year = e.target.value;
                        setEduWorkList(next);
                      }}
                    />
                  </div>
                ))}
              </div>

              <button className="add-skill-btn" onClick={addEduWork}>+ Add more</button>
              <p className="hint" style={{ marginBottom: '24px' }}>Add as many education or work entries as you like.</p>

              {/* Certifications & portfolio links */}
              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label>Certifications &amp; portfolio links</label>
                <span className="pts" id="pts-links">{hasLinks ? 'added ✓' : '+8%'}</span>
              </div>

              <div id="linksList">
                {linksList.map((lnk, idx) => (
                  <div key={lnk.id} className="entry-card">
                    <div className="entry-card-head">
                      <select
                        value={lnk.platform}
                        onChange={(e) => {
                          const next = [...linksList];
                          next[idx].platform = e.target.value;
                          setLinksList(next);
                        }}
                      >
                        <option>Certification</option>
                        <option>Portfolio website</option>
                        <option>LinkedIn</option>
                        <option>GitHub</option>
                        <option>Behance</option>
                        <option>Dribbble</option>
                        <option>Instagram</option>
                        <option>YouTube</option>
                        <option>Upwork</option>
                        <option>Fiverr</option>
                        <option value="other">Other — write your own</option>
                      </select>
                      {linksList.length > 1 && (
                        <button className="remove-skill" onClick={() => setLinksList(linksList.filter((item) => item.id !== lnk.id))}>✕</button>
                      )}
                    </div>

                    {lnk.platform === 'other' && (
                      <input
                        type="text"
                        className="custom-platform show"
                        placeholder="Type platform name"
                        value={lnk.customPlatform}
                        onChange={(e) => {
                          const next = [...linksList];
                          next[idx].customPlatform = e.target.value;
                          setLinksList(next);
                        }}
                      />
                    )}

                    <div className="link-upload-row">
                      <input
                        type="text"
                        placeholder="Paste link (optional)"
                        value={lnk.link}
                        onChange={(e) => {
                          const next = [...linksList];
                          next[idx].link = e.target.value;
                          setLinksList(next);
                        }}
                      />
                      <div
                        className={`mini-upload ${lnk.isUploaded ? 'done' : ''}`}
                        onClick={() => {
                          const next = [...linksList];
                          next[idx].isUploaded = !next[idx].isUploaded;
                          setLinksList(next);
                          triggerToast('+8% profile score');
                        }}
                      >
                        {lnk.isUploaded ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                            Uploaded
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                            Upload image
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="add-skill-btn" onClick={addLinkEntry}>+ Add more</button>
              <p className="hint" style={{ marginBottom: '24px' }}>Certificate image, portfolio site, LinkedIn — add whatever proves your work, in any order.</p>

              <div className="field">
                <div className="field-label"><label>Resume</label><span className="pts" id="pts-resume">{resumeUploadedStep3 || resumeParsed ? 'added ✓' : '+6%'}</span></div>
                <div
                  className={`upload-box ${resumeUploadedStep3 || resumeParsed ? 'done' : ''}`}
                  id="resumeUpload"
                  onClick={() => {
                    setResumeUploadedStep3(true);
                    triggerToast('+6% profile score');
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 3v5a1 1 0 0 0 1 1h5" /><path d="M6 21h12a1 1 0 0 0 1-1V7l-5-5H6a1 1 0 0 0-1 1v17a1 1 0 0 0 1 1z" /></svg>
                  <p>{resumeUploadedStep3 || resumeParsed ? 'Uploaded ✓' : 'Upload resume'}</p>
                  {!resumeUploadedStep3 && !resumeParsed && <p className="small">PDF or DOC, up to 5 MB</p>}
                </div>
              </div>
            </section>
          )}

          {/* STEP 4 : WORK PREFERENCES */}
          {currentStep === 4 && (
            <section className="panel active" data-panel="4">
              <h1 className="title">Set your work preferences</h1>
              <p className="sub-title">LucoHire will use these choices to show you more relevant projects and clients.</p>

              <div className="profile-score">
                <div className="score-top"><span>Profile strength so far</span><b id="bigScoreNum">{score}%</b></div>
                <div className="score-bar-track"><span id="bigScoreBar" style={{ width: `${score}%` }}></span></div>
                <small>Complete every section to reach 100%.</small>
              </div>

              <div className="preview-card-wrap">
                <p className="cap">Live preview — this is roughly how your card will look to clients</p>
                <div className="preview-card">
                  <div className="pv-top">
                    <div className="pv-avatar" id="pvAvatar">{avatarInitials}</div>
                    <div className="txt">
                      <p className="pv-name" id="pvName">{name.trim() || 'Your name'}</p>
                      <p className="pv-title" id="pvTitle">{title.trim() || 'Your professional title'}</p>
                      <p className="pv-loc" id="pvLoc">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
                        {city && state ? `${city}, ${state}` : 'City not set yet'}
                      </p>
                    </div>
                    <span className="pv-new">New profile</span>
                  </div>
                  <div className="pv-skill-row">
                    <p id="pvSkillName">{headlineSkill?.name === 'other' ? (headlineSkill.customName || 'Your top skill') : (headlineSkill?.name || 'Add a skill to preview it here')}</p>
                    <p className="r" id="pvSkillRate">{headlineSkill?.price ? `₹${headlineSkill.price}` : ''}</p>
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Languages</label><span className="pts done" id="pts-languages">✓ added</span></div>
                <div className="lang-add-row">
                  <select id="langSelect" value={newLang} onChange={(e) => setNewLang(e.target.value)}>
                    <option>Hindi</option><option>English</option><option>Bengali</option><option>Marathi</option>
                    <option>Telugu</option><option>Tamil</option><option>Gujarati</option><option>Urdu</option>
                    <option>Kannada</option><option>Odia</option><option>Malayalam</option><option>Punjabi</option>
                    <option>Assamese</option><option>Maithili</option><option>Sanskrit</option><option>Konkani</option>
                    <option>Bhojpuri</option><option>Rajasthani</option><option>Kashmiri</option><option>Other</option>
                  </select>
                  <select id="langLevel" value={newLangLevel} onChange={(e) => setNewLangLevel(e.target.value)}>
                    <option>Basic</option><option>Fluent</option><option>Expert</option>
                  </select>
                  <button className="lang-add-btn" onClick={addLangTag}>+ Add</button>
                </div>
                <div className="tag-box" id="langBox">
                  {languages.map((l) => (
                    <span key={l.lang} className={`tag lvl-${l.level.toLowerCase()}`} data-lang={l.lang}>
                      {l.lang} — {l.level} <button onClick={() => removeLangTag(l.lang)}>✕</button>
                    </span>
                  ))}
                </div>
                <p className="hint">Clients can filter freelancers by language and proficiency level.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Availability</label><span className="pts done" id="pts-availability">✓ added</span></div>
                <div className="skill-grid" style={{ marginBottom: '14px' }}>
                  <select value={availType} onChange={(e) => setAvailType(e.target.value)}>
                    <option>Full-time</option><option>Part-time</option><option>Weekends only</option>
                  </select>
                  <select value={availStart} onChange={(e) => setAvailStart(e.target.value)}>
                    <option>Available now</option><option>Within 1 week</option><option>Within 1 month</option>
                  </select>
                </div>

                <div className="info-card" style={{ marginBottom: 0 }}>
                  <div className="info-card-head">
                    <div className="left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      Availability calendar
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>Available now</span>
                      <label className="toggle-switch">
                        <input type="checkbox" checked={calAvailOn} onChange={(e) => setCalAvailOn(e.target.checked)} id="calAvailToggle" />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="boost-pill">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h6l-1 8 10-13h-6l1-7z" /></svg>
                    Boosted in search — clients see you first
                  </div>

                  <div className="day-pills" id="dayPills">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div
                        key={day}
                        className={`day-pill ${activeDays.includes(day) ? 'active' : ''}`}
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="time-row">
                    <select id="calFrom" value={calFrom} onChange={(e) => setCalFrom(e.target.value)}>
                      <option>8:00 AM</option><option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
                    </select>
                    <span className="to">to</span>
                    <select id="calTo" value={calTo} onChange={(e) => setCalTo(e.target.value)}>
                      <option>4:00 PM</option><option>5:00 PM</option><option>6:00 PM</option><option>7:00 PM</option><option>8:00 PM</option>
                    </select>
                  </div>
                  <p className="foot-note" id="calNote">
                    Replies within 2 hours — WhatsApp {waFrom}–{waTo} — Work {calFrom}–{calTo}
                  </p>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Preferred project duration</label><span className="pts done" id="pts-duration">✓ added</span></div>
                <select value={preferredDuration} onChange={(e) => setPreferredDuration(e.target.value)}>
                  <option>Any duration</option><option>One-time quick task</option><option>Under 1 month</option><option>1–3 months</option><option>Long-term collaboration</option>
                </select>
              </div>

              <div className="field">
                <div className="field-label"><label>WhatsApp availability</label><span className="pts done" id="pts-waAvailability">✓ added</span></div>
                <div className="info-card" style={{ marginBottom: '8px' }}>
                  <div className="info-card-head">
                    <div className="left">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1FA854" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                      WhatsApp availability
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={waOn} onChange={(e) => setWaOn(e.target.checked)} id="waAvailToggle" />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="time-row">
                    <select id="waFrom" value={waFrom} onChange={(e) => setWaFrom(e.target.value)}>
                      <option>6:00 AM</option><option>7:00 AM</option><option>8:00 AM</option><option>9:00 AM</option>
                      <option>10:00 AM</option><option>11:00 AM</option><option>12:00 PM</option>
                    </select>
                    <span className="to">to</span>
                    <select id="waTo" value={waTo} onChange={(e) => setWaTo(e.target.value)}>
                      <option>4:00 PM</option><option>5:00 PM</option><option>6:00 PM</option>
                      <option>7:00 PM</option><option>8:00 PM</option><option>9:00 PM</option><option>10:00 PM</option>
                    </select>
                  </div>

                  <p className="foot-note" id="waAvailNote">
                    {waOn ? `Client ko dikhega: WhatsApp active ${waFrom} – ${waTo}` : 'WhatsApp availability is currently turned off'}
                  </p>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Contact consent</label><span className="pts" id="pts-consent">{consentCheck && activeMediums.length ? 'added ✓' : '+3%'}</span></div>
                <div className="tnc-row" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentCheck}
                    onChange={(e) => {
                      setConsentCheck(e.target.checked);
                      if (e.target.checked && activeMediums.length) triggerToast('+3% profile score');
                    }}
                  />
                  <p>Main apna contact medium apni marzi se share kar raha/rahi hoon, taaki clients mujhse seedha contact kar sakein.</p>
                </div>

                <div className="medium-grid" id="mediumGrid">
                  {[
                    { id: 'message', label: 'Message', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
                    { id: 'mail', label: 'Email', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg> },
                    { id: 'whatsapp', label: 'WhatsApp', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> },
                    { id: 'call', label: 'Call', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 3a2 2 0 0 1-.4 2.1L8 10.3a16 16 0 0 0 6 6l1.5-1.5a2 2 0 0 1 2.1-.4c1 .3 2 .5 3 .7a2 2 0 0 1 1.4 2.1z" /></svg> }
                  ].map((m) => (
                    <div
                      key={m.id}
                      className={`medium-chip ${activeMediums.includes(m.id) ? 'active' : ''}`}
                      onClick={() => toggleMedium(m.id)}
                    >
                      {m.icon}
                      {m.label}
                    </div>
                  ))}
                </div>
                <p className="hint">Only the mediums you select above will be visible to clients on your profile.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Voice & video intro</label><span className="pts" id="pts-voiceIntro">{voiceIntro || videoIntro ? 'added ✓' : '+4%'}</span></div>
                <div className="av-intro-grid">
                  <div className="av-intro-box">
                    <div className="av-lbl">🎙️ 7s Voice intro</div>
                    <button
                      className={`record-btn ${voiceIntro ? 'done' : ''}`}
                      id="voiceRecBtn"
                      onClick={() => {
                        const next = !voiceIntro;
                        setVoiceIntro(next);
                        if (next) triggerToast('+4% profile score');
                      }}
                    >
                      {voiceIntro ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                          Voice intro added
                        </>
                      ) : (
                        <>
                          <span className="dot"></span> Hold to record
                        </>
                      )}
                    </button>
                    <p className="av-note">Clients 40% zyada reply karte hain jab voice intro ho.</p>
                  </div>

                  <div className="av-intro-box">
                    <div className="av-lbl">📹 15s Video intro</div>
                    <button
                      className={`record-btn ${videoIntro ? 'done' : ''}`}
                      id="videoUpBtn"
                      onClick={() => {
                        const next = !videoIntro;
                        setVideoIntro(next);
                        if (next) triggerToast('+4% profile score');
                      }}
                    >
                      {videoIntro ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                          Video uploaded
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                          Upload
                        </>
                      )}
                    </button>
                    <p className="av-note">Optional, but boosts trust with clients.</p>
                  </div>
                </div>
              </div>

              <div className="field">
                <div className="field-label"><label>Get a verified badge</label><span className="pts" id="pts-idVerify">{idDocUploaded ? 'added ✓' : '+8%'}</span></div>
                <div className="verify-card" id="idVerifyCard" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <div className="vtxt" style={{ flex: 1 }}>
                      <p className="v1" id="idVerifyTitle">{idDocUploaded ? 'Document uploaded' : 'ID verification'}</p>
                      <p className="v2" id="idVerifySub">{idDocUploaded ? 'Verification usually completes within 24 hours' : 'Aadhaar / PAN — verified badge + search boost'}</p>
                    </div>
                    <span className={`trust-chip ${idVerifyOn ? 'on' : ''}`} id="idTrustChip">
                      {idVerifyOn ? 'Verification in progress' : 'Optional — 3x trust'}
                    </span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={idVerifyOn} onChange={(e) => setIdVerifyOn(e.target.checked)} id="idVerifyToggle" />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <select id="idTypeSelect" value={idDocType} onChange={(e) => setIdDocType(e.target.value)}>
                    <option value="">Select ID document type</option>
                    <option>Aadhaar Card</option>
                    <option>PAN Card</option>
                    <option>Voter ID</option>
                    <option>Driving Licence</option>
                    <option>Passport</option>
                    <option>Udyam / MSME Registration</option>
                    <option>GST Certificate</option>
                  </select>

                  <div
                    className={`upload-box ${idDocUploaded ? 'done' : ''}`}
                    id="idUploadBox"
                    style={{ marginBottom: 0 }}
                    onClick={() => {
                      setIdDocUploaded(true);
                      setIdVerifyOn(true);
                      triggerToast('+8% profile score');
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                    <p>{idDocUploaded ? 'Uploaded ✓' : 'Upload document'}</p>
                    {!idDocUploaded && <p className="small">Photo or PDF, up to 5 MB</p>}
                  </div>

                  <div className="trust-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1FA854" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    Trust +40% — Get 3x more calls
                  </div>
                </div>
                <p className="privacy-note">Private &amp; encrypted — profile pe kabhi nahi dikhega, sirf verification ke liye.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Your WhatsApp profile card</label></div>
                <div className="wa-summary-card">
                  <div className="wa-summary-head">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20z" /></svg>
                    This is what clients will see on WhatsApp
                  </div>
                  <div className="wa-summary-body">
                    <div className="wa-summary-row"><span className="k">Name</span><span className="v" id="waName">{name.trim() || 'Your name'}</span></div>
                    <div className="wa-summary-row"><span className="k">Headline skill</span><span className="v" id="waSkill">{headlineSkill?.name === 'other' ? (headlineSkill.customName || 'Your skill') : (headlineSkill?.name || 'Add a skill to preview')}</span></div>
                    <div className="wa-summary-row"><span className="k">Starting rate</span><span className="v" id="waRate">{headlineSkill?.price ? `₹${headlineSkill.price} / ${headlineSkill.priceType.toLowerCase()}` : '₹3,000 / project'}</span></div>
                    <div className="wa-summary-row"><span className="k">Location</span><span className="v" id="waLoc">{city && state ? `${city}, ${state}` : (city || 'City not set yet')}</span></div>
                    <div className="wa-summary-row"><span className="k">Languages</span><span className="v" id="waLangs">{languages.length ? languages.map((l) => l.lang).join(', ') : 'Hindi, English'}</span></div>
                    <div className="wa-summary-row"><span className="k">WhatsApp active</span><span className="v" id="waActive">{waOn ? `${waFrom} – ${waTo}` : 'Turned off'}</span></div>
                    <div className="wa-summary-row"><span className="k">Contact via</span><span className="v" id="waMediums">{consentCheck && activeMediums.length ? activeMediums.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ') : 'Not shared yet'}</span></div>
                    <div className="wa-summary-row"><span className="k">Verified</span><span className="v" id="waVerified">{idDocUploaded && mobileVerified ? 'ID & Mobile verified ✓' : (mobileVerified ? 'Mobile verified ✓' : 'Not verified yet')}</span></div>
                  </div>
                  <div style={{ padding: '0 16px 14px' }}>
                    <p className="wa-summary-foot">This card updates automatically as you complete your profile.</p>
                  </div>
                </div>
              </div>

              <div className="tnc-row">
                <input type="checkbox" id="tncCheck" checked={tncCheck} onChange={(e) => setTncCheck(e.target.checked)} />
                <p>I agree to LucoHire's <a href="#" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a> and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>, and confirm the details I've provided are accurate.</p>
              </div>
            </section>
          )}
        </main>

        <footer className="wizard-footer">
          <button id="backBtn" disabled={currentStep === 1} onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}>
            Back
          </button>
          <button
            id="nextBtn"
            className={currentStep === totalSteps ? 'final' : ''}
            disabled={currentStep === totalSteps && !tncCheck}
            onClick={() => {
              if (currentStep === totalSteps) {
                handleFinish();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
          >
            {currentStep === totalSteps ? 'Create my profile' : 'Continue'}
          </button>
        </footer>
      </div>
    </div>
  );
}
