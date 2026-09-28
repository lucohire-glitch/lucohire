/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import LucoLogo from './LucoLogo';

interface RecruiterRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
  onSwitchToCandidate: () => void;
}

export default function RecruiterRegistration({
  isOpen,
  onClose,
  onComplete,
  onSwitchToCandidate
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
  const [gstType, setGstType] = useState('');
  const [gstUploaded, setGstUploaded] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [description, setDescription] = useState('');
  const [authCheck, setAuthCheck] = useState(false);
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
          </p>
        </header>

        <main className="wizard-main">
          {/* STEP 1 : YOUR DETAILS */}
          {recCurrent === 1 && (
            <section className="panel active" data-panel="1">
              <h1 className="title">Create your recruiter account</h1>
              <p className="sub-title">Post jobs free and start shortlisting candidates who actually match — verified profiles, WhatsApp-ready.</p>

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

                  <div
                    className={`upload-box ${gstUploaded ? 'done' : ''}`}
                    id="recGstUploadBox"
                    style={{ marginBottom: 0 }}
                    onClick={() => {
                      setGstUploaded(true);
                      triggerToast('+25% employer trust score');
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
                    <p>{gstUploaded ? 'Uploaded ✓' : 'Upload document'}</p>
                    {!gstUploaded && <p className="small">Photo or PDF, up to 5 MB</p>}
                  </div>

                  <div className="trust-row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1FA854" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    Trust +40% — 3x more candidate responses
                  </div>
                </div>
                <p className="privacy-note">Private &amp; encrypted — used for verification only, never shown publicly.</p>
              </div>

              <div className="field">
                <div className="field-label"><label>Company logo</label><span className="pts" id="rpts-logo">{logoUploaded ? 'added ✓' : '+3%'}</span></div>
                <div
                  className={`upload-box ${logoUploaded ? 'done' : ''}`}
                  id="recLogoUpload"
                  onClick={() => {
                    setLogoUploaded(true);
                    triggerToast('+3% employer trust score');
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 8a2 2 0 0 1 2-2h1l1-2h8l1 2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  <p>{logoUploaded ? 'Uploaded ✓' : 'Upload logo'}</p>
                  {!logoUploaded && <p className="small">PNG or JPG, square works best</p>}
                </div>
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
