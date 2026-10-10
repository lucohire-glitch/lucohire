/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import LucoLogo from './LucoLogo';
import './RecruiterRegistration.css';

interface RecruiterRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  onSwitchToCandidate: () => void;
  onDirectOpenDashboard?: () => void;
}

export default function RecruiterRegistration({
  isOpen,
  onClose,
  onComplete,
  onSwitchToCandidate,
  onDirectOpenDashboard
}: RecruiterRegistrationProps) {
  const [recCurrent, setRecCurrent] = useState(1);
  const recTotal = 3;
  const recLabels: Record<number, string> = {
    1: 'Your details',
    2: 'Company details',
    3: 'Verify & post'
  };

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '']);

  // Step 2
  const [company, setCompany] = useState('');
  const [hiringType, setHiringType] = useState('company');
  const [agencyLicense, setAgencyLicense] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');

  // Step 3
  const [gstToggleOn, setGstToggleOn] = useState(false);
  const [gstType, setGstType] = useState('GSTIN');
  const [gstUploaded, setGstUploaded] = useState(false);
  const [gstFileName, setGstFileName] = useState('');
  const [gstFileSize, setGstFileSize] = useState('');
  const [gstFileUrl, setGstFileUrl] = useState('');
  const [isDraggingGst, setIsDraggingGst] = useState(false);
  const gstInputRef = useRef<HTMLInputElement>(null);

  const [logoUploaded, setLogoUploaded] = useState(false);
  const [logoFileName, setLogoFileName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [authCheck, setAuthCheck] = useState(false);
  const [tncCheck, setTncCheck] = useState(false);

  // Score toast state
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleGstFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGstFileName(file.name);
      setGstFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
      const url = URL.createObjectURL(file);
      setGstFileUrl(url);
      setGstUploaded(true);
      setGstToggleOn(true);
      triggerToast('+25% employer trust score');
    }
  };

  const handleGstDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGst(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setGstFileName(file.name);
      setGstFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
      const url = URL.createObjectURL(file);
      setGstFileUrl(url);
      setGstUploaded(true);
      setGstToggleOn(true);
      triggerToast('+25% employer trust score');
    }
  };

  const handleRemoveGst = () => {
    setGstUploaded(false);
    setGstFileName('');
    setGstFileSize('');
    setGstFileUrl('');
    if (gstInputRef.current) gstInputRef.current.value = '';
  };

  const handleSampleGst = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGstFileName('GSTIN_29AABCB1234F1Z5_RegCert.pdf');
    setGstFileSize('1.4 MB');
    setGstUploaded(true);
    setGstToggleOn(true);
    triggerToast('+25% employer trust score');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      setLogoUploaded(true);
      triggerToast('+3% employer trust score');
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setLogoFileName(file.name);
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
      setLogoUploaded(true);
      triggerToast('+3% employer trust score');
    }
  };

  const handleRemoveLogo = () => {
    setLogoUploaded(false);
    setLogoFileName('');
    setLogoUrl('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSampleLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoFileName('company-brand-logo.png');
    setLogoUrl('https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=160&auto=format&fit=crop&q=80');
    setLogoUploaded(true);
    triggerToast('+3% employer trust score');
  };

  React.useEffect(() => {
    if (isOpen) {
      const recScreen = document.getElementById('recruiterRegistrationScreen');
      if (recScreen) {
        recScreen.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [isOpen, recCurrent]);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1400);
  };

  // Score calculation
  let score = 0;
  if (name.trim()) score += 8;
  if (role.trim()) score += 5;
  if (emailVerified) score += 15;
  if (mobileVerified) score += 15;
  if (company.trim()) score += 10;
  if (hiringType) score += 5;
  if (industry) score += 3;
  if (size) score += 3;
  if (city.trim()) score += 3;
  if (state) score += 2;
  if (website.trim()) score += 6;
  if (gstUploaded) score += 25;
  if (logoUploaded) score += 3;
  if (description.trim()) score += 2;
  score = Math.min(100, score);

  const handleFinish = () => {
    if (!authCheck || !tncCheck) return;
    onComplete({
      name: name || 'Priya Mehta',
      company: company || 'Brightside Retail Pvt Ltd',
      role: role || 'HR Manager',
      city: city || 'Bengaluru',
      score,
      verified: gstUploaded
    });
  };

  return (
    <div id="recruiterRegistrationScreen">
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
              <div className="score-ring" id="recScoreRing" style={{ '--pct': score } as any}>
                <span id="recScoreNum">{score}</span>
              </div>
              <div className="score-txt">employer trust <b id="recScoreLine">{score}%</b></div>
            </div>
          </div>

          <div className="steps">
            <div className="step-track"><span style={{ width: recCurrent >= 1 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: recCurrent >= 2 ? '100%' : '0%' }}></span></div>
            <div className="step-track"><span style={{ width: recCurrent >= 3 ? '100%' : '0%' }}></span></div>
          </div>

          <div className="step-meta">
            <span>step <b id="recStepNum">{recCurrent}</b> of {recTotal}</span>
            <span id="recStepLabel">{recLabels[recCurrent]}</span>
          </div>

          <p className="switch-role-link">
            Looking for work instead?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onClose(); onSwitchToCandidate(); }}>
              Switch to Candidate sign up →
            </a>
            {onDirectOpenDashboard && (
              <>
                {' '}•{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onDirectOpenDashboard(); }}>
                  Open Recruiter Dashboard →
                </a>
              </>
            )}
          </p>
        </header>

        <main className="wizard-main">
          {/* STEP 1 : YOUR DETAILS */}
          {recCurrent === 1 && (
            <section className="panel active" data-panel="1">
              <h1 className="title">Create your recruiter account</h1>
              <p className="sub-title">Post jobs free and start shortlisting candidates who actually match — verified profiles, WhatsApp-ready.</p>

              <div className="rec-desktop-two-col">
                <div className="field">
                  <div className="field-label">
                    <label>Full name</label>
                    <span className="pts" id="rpts-name">{name.trim() ? 'added ✓' : '+8%'}</span>
                  </div>
                  <input
                    type="text"
                    id="recNameInput"
                    placeholder="e.g. Priya Mehta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="field-label">
                    <label>Your role / designation</label>
                    <span className="pts" id="rpts-role">{role.trim() ? 'added ✓' : '+5%'}</span>
                  </div>
                  <input
                    type="text"
                    id="recRoleInput"
                    placeholder="e.g. HR Manager, Talent Acquisition"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <p className="hint">This appears on every job you post, so candidates know who's hiring.</p>
                </div>
              </div>

              <div className="rec-desktop-two-col">
                <div className="field">
                  <div className="field-label">
                    <label>Work email</label>
                    <span className="pts" id="rpts-workEmailVerified">{emailVerified ? 'added ✓' : '+15%'}</span>
                  </div>
                  {!emailVerified ? (
                    <>
                      <div className="verify-row" id="recWorkEmailVerifyRow">
                        <input
                          type="email"
                          id="recWorkEmailInput"
                          placeholder="e.g. priya@company.com"
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                        />
                        <button
                          className="verify-btn"
                          id="recWorkEmailSendBtn"
                          disabled={!(workEmail.includes('@') && workEmail.includes('.'))}
                          onClick={() => setShowEmailOtp(true)}
                        >
                          Send OTP
                        </button>
                      </div>
                      {showEmailOtp && (
                        <div className="otp-box show" id="recWorkEmailOtpBox">
                          <p className="lbl">Enter the 4-digit OTP sent to your work email</p>
                          <div className="otp-inputs" id="recWorkEmailOtpInputs">
                            {[0, 1, 2, 3].map((i) => (
                              <input
                                key={i}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                value={emailOtp[i]}
                                onChange={(e) => {
                                  const next = [...emailOtp];
                                  next[i] = e.target.value;
                                  setEmailOtp(next);
                                }}
                              />
                            ))}
                          </div>
                          <div className="otp-actions">
                            <button onClick={() => { setShowEmailOtp(false); setEmailVerified(true); triggerToast('+15% employer trust score'); }}>Confirm</button>
                            <span onClick={() => triggerToast('OTP resent to email!')}>Resend OTP</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="verified-chip">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
                      {workEmail} verified
                    </div>
                  )}
                  <p className="hint">Using your company email speeds up verification and builds candidate trust.</p>
                </div>

                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="field-label">
                    <label>Mobile number</label>
                    <span className="pts" id="rpts-mobileVerified">{mobileVerified ? 'added ✓' : '+15%'}</span>
                  </div>
                  {!mobileVerified ? (
                    <>
                      <div className="verify-row" id="recMobileVerifyRow">
                        <input
                          type="tel"
                          id="recMobileInput"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                        />
                        <button
                          className="verify-btn"
                          id="recMobileSendBtn"
                          disabled={mobile.trim().length !== 10}
                          onClick={() => setShowMobileOtp(true)}
                        >
                          Send OTP
                        </button>
                      </div>
                      {showMobileOtp && (
                        <div className="otp-box show" id="recMobileOtpBox">
                          <p className="lbl">Enter the 4-digit OTP sent to your phone</p>
                          <div className="otp-inputs" id="recMobileOtpInputs">
                            {[0, 1, 2, 3].map((i) => (
                              <input
                                key={i}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                value={mobileOtp[i]}
                                onChange={(e) => {
                                  const next = [...mobileOtp];
                                  next[i] = e.target.value;
                                  setMobileOtp(next);
                                }}
                              />
                            ))}
                          </div>
                          <div className="otp-actions">
                            <button onClick={() => { setShowMobileOtp(false); setMobileVerified(true); triggerToast('+15% employer trust score'); }}>Confirm</button>
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
              </div>
            </section>
          )}

          {/* STEP 2 : COMPANY DETAILS */}
          {recCurrent === 2 && (
            <section className="panel active" data-panel="2">
              <h1 className="title">Tell us about your company</h1>
              <p className="sub-title">This appears on every job you post and helps candidates trust the listing.</p>

              <div className="field">
                <div className="field-label">
                  <label>Company name</label>
                  <span className="pts" id="rpts-company">{company.trim() ? 'added ✓' : '+10%'}</span>
                </div>
                <input
                  type="text"
                  id="recCompanyInput"
                  placeholder="e.g. Brightside Retail Pvt Ltd"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="field-label" style={{ marginBottom: '10px' }}>
                <label>I'm hiring as</label>
                <span className="pts" id="rpts-hiringType">{hiringType ? 'added ✓' : '+5%'}</span>
              </div>

              <div className="choice-list" style={{ marginBottom: '22px' }}>
                <label className="choice">
                  <input
                    type="radio"
                    name="hiringType"
                    value="company"
                    checked={hiringType === 'company'}
                    onChange={(e) => setHiringType(e.target.value)}
                  />
                  <span><strong>Company / In-house HR</strong><span>Hiring directly for your own organisation.</span></span>
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="hiringType"
                    value="agency"
                    checked={hiringType === 'agency'}
                    onChange={(e) => setHiringType(e.target.value)}
                  />
                  <span><strong>Staffing &amp; Recruitment Agency</strong><span>Hiring on behalf of client companies.</span></span>
                </label>
                <label className="choice">
                  <input
                    type="radio"
                    name="hiringType"
                    value="independent"
                    checked={hiringType === 'independent'}
                    onChange={(e) => setHiringType(e.target.value)}
                  />
                  <span><strong>Independent / Freelance Recruiter</strong><span>Hiring individually, not tied to one company.</span></span>
                </label>
              </div>

              {hiringType === 'agency' && (
                <>
                  <div className="agency-note" id="agencyNote" style={{ display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                    <p>As an agency, you'll need to name the hiring company on every job you post — required under Indian contract-labour rules.</p>
                  </div>
                  <div className="field agency-only" id="agencyLicenseField" style={{ display: 'block', marginTop: '14px' }}>
                    <div className="field-label"><label>Agency license no. <span style={{ fontWeight: 400, color: 'var(--ink-faint)' }}>(if applicable)</span></label></div>
                    <input
                      type="text"
                      id="recAgencyLicenseInput"
                      placeholder="CLRA / state labour license number"
                      value={agencyLicense}
                      onChange={(e) => setAgencyLicense(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="two-col" style={{ marginBottom: '20px' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="field-label"><label>Industry</label><span className="pts" id="rpts-industry">{industry ? 'added ✓' : '+3%'}</span></div>
                  <select id="recIndustrySelect" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                    <option value="">Select</option>
                    <option>IT &amp; Software</option><option>Retail &amp; E-commerce</option><option>BFSI</option>
                    <option>Manufacturing</option><option>Healthcare</option><option>Education</option>
                    <option>Hospitality</option><option>Logistics</option><option>Real Estate</option>
                    <option>Staffing / HR Services</option><option>Other</option>
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="field-label"><label>Company size</label><span className="pts" id="rpts-size">{size ? 'added ✓' : '+3%'}</span></div>
                  <select id="recSizeSelect" value={size} onChange={(e) => setSize(e.target.value)}>
                    <option value="">Select</option>
                    <option>1–10</option><option>11–50</option><option>51–200</option>
                    <option>201–1000</option><option>1000+</option>
                  </select>
                </div>
              </div>

              <div className="two-col" style={{ marginBottom: '20px' }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="field-label"><label>City</label><span className="pts" id="rpts-city">{city.trim() ? 'added ✓' : '+3%'}</span></div>
                  <input type="text" id="recCityInput" placeholder="e.g. Bengaluru" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="field-label"><label>State</label><span className="pts" id="rpts-state">{state ? 'added ✓' : '+2%'}</span></div>
                  <select id="recStateSelect" value={state} onChange={(e) => setState(e.target.value)}>
                    <option value="">Select</option>
                    <option>Andhra Pradesh</option><option>Delhi NCR</option><option>Gujarat</option>
                    <option>Haryana</option><option>Karnataka</option><option>Maharashtra</option>
                    <option>Tamil Nadu</option><option>Telangana</option><option>Uttar Pradesh</option>
                    <option>West Bengal</option><option>Other</option>
                  </select>
                </div>
              </div>

              <p className="hint" style={{ marginTop: '-14px', marginBottom: '20px' }}>Your registered office location — used for invoicing and legal notices, never shown publicly.</p>

              <div className="field" style={{ marginBottom: 0 }}>
                <div className="field-label"><label>Company website or LinkedIn page</label><span className="pts" id="rpts-website">{website.trim() ? 'added ✓' : '+6%'}</span></div>
                <input type="text" id="recWebsiteInput" placeholder="e.g. www.brightside.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                <p className="hint">Optional, but helps us verify your company instantly.</p>
              </div>
            </section>
          )}

          {/* STEP 3 : VERIFY & POST */}
          {recCurrent === 3 && (
            <section className="panel active" data-panel="3">
              <h1 className="title">Verify &amp; post your first job</h1>
              <p className="sub-title">A verified badge gets your jobs seen first and gets you far more responses.</p>

              <div className="profile-score">
                <div className="score-top"><span>Employer trust score</span><b id="recBigScoreNum">{score}%</b></div>
                <div className="score-bar-track"><span id="recBigScoreBar" style={{ width: `${score}%` }}></span></div>
                <small>Verify your company to unlock the Verified Employer badge.</small>
              </div>

              <div className="field">
                <div className="field-label"><label>Get a Verified Employer badge</label><span className="pts" id="rpts-gst">{gstUploaded ? 'added ✓' : '+25%'}</span></div>
                <div className="verify-card" id="recGstCard" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4C2FD9" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg>
                    <div className="vtxt" style={{ flex: 1 }}>
                      <p className="v1" id="recGstTitle">{gstUploaded ? 'Document uploaded' : 'Company verification'}</p>
                      <p className="v2" id="recGstSub">{gstUploaded ? 'Verification usually completes within 24 hours' : 'GSTIN / CIN / Udyam — verified badge + top placement'}</p>
                    </div>
                    <span className={`trust-chip ${gstToggleOn ? 'on' : ''}`} id="recTrustChip">
                      {gstToggleOn ? 'Verification in progress' : 'Optional — 3x replies'}
                    </span>
                    <label className="toggle-switch">
                      <input type="checkbox" id="recGstToggle" checked={gstToggleOn} onChange={(e) => setGstToggleOn(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <select id="recGstTypeSelect" value={gstType} onChange={(e) => setGstType(e.target.value)}>
                    <option value="">Select document type</option>
                    <option>GSTIN</option>
                    <option>CIN (Company Incorporation Number)</option>
                    <option>Udyam / MSME Registration</option>
                    <option>Company PAN</option>
                  </select>

                  {/* Real hidden file input for business document */}
                  <input
                    type="file"
                    ref={gstInputRef}
                    accept=".pdf,image/*,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleGstFileChange}
                  />

                  {!gstUploaded ? (
                    <div
                      className={`rec-upload-zone ${isDraggingGst ? 'dragging' : ''}`}
                      id="recGstUploadBox"
                      onClick={() => gstInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingGst(true); }}
                      onDragLeave={() => setIsDraggingGst(false)}
                      onDrop={handleGstDrop}
                      title="Click or drag & drop business document"
                    >
                      <div className="rec-upload-icon-circle">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 12 15 15" />
                        </svg>
                      </div>
                      <p className="rec-upload-title">Click to upload document or drag &amp; drop</p>
                      <p className="rec-upload-sub">Supports PDF, PNG, JPG, DOC up to 5 MB</p>
                      <button
                        type="button"
                        onClick={handleSampleGst}
                        style={{
                          marginTop: '6px',
                          background: '#FFFFFF',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: 'var(--teal-deep)',
                          cursor: 'pointer'
                        }}
                      >
                        + Use sample certificate
                      </button>
                    </div>
                  ) : (
                    <div className="rec-file-card">
                      <div className="rec-file-info">
                        <div className="rec-file-icon-box">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="rec-file-meta">
                          <p className="rec-file-name" title={gstFileName}>{gstFileName || 'GSTIN_Registration_Certificate.pdf'}</p>
                          <span className="rec-file-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            {gstFileSize ? `${gstFileSize} • Uploaded & Verified` : 'Uploaded & Verified'}
                          </span>
                        </div>
                      </div>
                      <div className="rec-file-actions">
                        <button
                          type="button"
                          className="rec-file-btn"
                          onClick={() => gstInputRef.current?.click()}
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          className="rec-file-btn danger"
                          onClick={handleRemoveGst}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="trust-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1FA854" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    Trust +40% — 3x more candidate responses
                  </div>
                </div>
                <p className="privacy-note">Private &amp; encrypted — used for verification only, never shown publicly.</p>
              </div>

              <div className="field">
                <div className="field-label">
                  <label>Company logo</label>
                  <span className="pts" id="rpts-logo">{logoUploaded ? 'added ✓' : '+3%'}</span>
                </div>

                {/* Real hidden file input for company logo */}
                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoFileChange}
                />

                {!logoUploaded ? (
                  <div
                    className={`rec-upload-zone ${isDraggingLogo ? 'dragging' : ''}`}
                    id="recLogoUpload"
                    onClick={() => logoInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={handleLogoDrop}
                    title="Click or drag & drop company logo"
                  >
                    <div className="rec-upload-icon-circle">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M4 8a2 2 0 0 1 2-2h1l1-2h8l1 2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
                        <circle cx="12" cy="13" r="3.5" />
                      </svg>
                    </div>
                    <p className="rec-upload-title">Click to upload company logo or drag &amp; drop</p>
                    <p className="rec-upload-sub">PNG, JPG, SVG — square format recommended (min 150x150)</p>
                    <button
                      type="button"
                      onClick={handleSampleLogo}
                      style={{
                        marginTop: '6px',
                        background: '#FFFFFF',
                        border: '1px solid var(--line)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--teal-deep)',
                        cursor: 'pointer'
                      }}
                    >
                      + Use sample logo
                    </button>
                  </div>
                ) : (
                  <div className="rec-file-card">
                    <div className="rec-file-info">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Company logo preview" className="rec-logo-preview-box" />
                      ) : (
                        <div className="rec-file-icon-box">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div className="rec-file-meta">
                        <p className="rec-file-name" title={logoFileName}>{logoFileName || 'company-brand-logo.png'}</p>
                        <span className="rec-file-tag">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                          Logo ready &amp; active
                        </span>
                      </div>
                    </div>
                    <div className="rec-file-actions">
                      <button
                        type="button"
                        className="rec-file-btn"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className="rec-file-btn danger"
                        onClick={handleRemoveLogo}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="field">
                <div className="field-label"><label>Short company description</label><span className="pts" id="rpts-description">{description.trim() ? 'added ✓' : '+2%'}</span></div>
                <textarea
                  id="recDescInput"
                  placeholder="One or two lines candidates will see on your job posts..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="tnc-row" style={{ marginBottom: '10px' }}>
                <input type="checkbox" id="recAuthCheck" checked={authCheck} onChange={(e) => setAuthCheck(e.target.checked)} />
                <p>I confirm I'm authorized to create this account on behalf of <b>{company.trim() || 'my company'}</b>, and that all details provided above are accurate.</p>
              </div>

              <div className="tnc-row">
                <input type="checkbox" id="recTncCheck" checked={tncCheck} onChange={(e) => setTncCheck(e.target.checked)} />
                <p>I agree to LucoHire's <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a>, and consent to candidate data being processed solely to evaluate and contact them for this hiring purpose, in line with a fair, non-discriminatory hiring practice.</p>
              </div>
            </section>
          )}
        </main>

        <footer className="wizard-footer">
          <button id="recBackBtn" disabled={recCurrent === 1} onClick={() => setRecCurrent(Math.max(1, recCurrent - 1))}>
            Back
          </button>
          <button
            id="recNextBtn"
            className={recCurrent === recTotal ? 'final' : ''}
            disabled={recCurrent === recTotal && (!authCheck || !tncCheck)}
            onClick={() => {
              if (recCurrent === recTotal) {
                handleFinish();
              } else {
                setRecCurrent(recCurrent + 1);
              }
            }}
          >
            {recCurrent === recTotal ? 'Create employer account' : 'Continue'}
          </button>
        </footer>
      </div>
    </div>
  );
}
