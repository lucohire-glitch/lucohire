import bcrypt from 'bcryptjs';
import { CandidateModel } from '../models/candidateModel.js';
import { RecruiterModel } from '../models/recruiterModel.js';
import { signToken, publicUser } from '../utils/token.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const emailOk = (e) => EMAIL_REGEX.test((e || '').trim());
const mobileOk = (m) => MOBILE_REGEX.test((m || '').toString().trim());
const normEmail = (e) => (e || '').toLowerCase().trim();

// In-memory OTP storage: target -> { otp, expiresAt }
const otpStore = new Map();

export const sendOtp = async (req, res) => {
  const { target, type } = req.body || {};
  if (!target || typeof target !== 'string' || !target.trim()) {
    return res.status(400).json({ error: 'Target email or phone number is required.' });
  }

  const cleanTarget = target.trim().toLowerCase();

  // Validate format based on type
  if (type === 'email' && !emailOk(cleanTarget)) {
    return res.status(400).json({ error: 'Invalid email address. Please enter a valid email format (e.g. name@domain.com).' });
  }

  if (type === 'mobile') {
    const digitsOnly = cleanTarget.replace(/\D/g, '').slice(-10);
    if (!mobileOk(digitsOnly)) {
      return res.status(400).json({ error: 'Invalid mobile number. Please enter a valid 10-digit number starting with 6, 7, 8, or 9.' });
    }
  }

  // 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore.set(cleanTarget, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  console.log(`\n========================================`);
  console.log(`[LucoHire OTP] Target: ${cleanTarget} (${type || 'general'}) | Code: ${otp}`);
  console.log(`========================================\n`);

  res.json({
    success: true,
    otp, // Returned for testing in frontend console and response
    message: `OTP sent successfully to ${target}`,
  });
};

export const verifyOtp = async (req, res) => {
  const { target, otp } = req.body || {};
  if (!target || !otp) {
    return res.status(400).json({ error: 'Target and OTP are required.' });
  }
  const cleanTarget = target.trim().toLowerCase();
  const cleanOtp = otp.toString().trim();
  const record = otpStore.get(cleanTarget);

  // Accept generated OTP or master test code '1234'
  if (cleanOtp === '1234' || (record && record.otp === cleanOtp && record.expiresAt > Date.now())) {
    otpStore.delete(cleanTarget);
    return res.json({ success: true, message: 'OTP verified successfully.' });
  }

  res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
};

const validateSignup = ({ name, email, password, mobile }) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return 'Full name is required (at least 2 characters).';
  }
  if (!emailOk(email)) {
    return 'Invalid email address format (e.g. name@gmail.com).';
  }
  if (mobile) {
    const cleanMobile = mobile.toString().replace(/\D/g, '').slice(-10);
    if (!mobileOk(cleanMobile)) {
      return 'Invalid mobile number. Must be a 10-digit number starting with 6, 7, 8, or 9.';
    }
  }
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
};

const normMobile = (m) => (m ? m.toString().replace(/\D/g, '').slice(-10) : null);

const respond = (res, status, role, row) =>
  res.status(status).json({ token: signToken(role, row), role, user: publicUser(row) });

export const candidateSignup = async (req, res) => {
  const msg = validateSignup(req.body || {});
  if (msg) return res.status(400).json({ error: msg });
  const b = req.body;
  const targetEmail = normEmail(b.email);
  const targetMobile = normMobile(b.mobile);

  // Check email uniqueness across both roles
  const existingCandidateEmail = await CandidateModel.findByEmail(targetEmail);
  const existingRecruiterEmail = await RecruiterModel.findByEmail(targetEmail);
  if (existingCandidateEmail || existingRecruiterEmail) {
    return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
  }

  // Check mobile uniqueness across both roles
  if (targetMobile) {
    const existingCandidateMobile = await CandidateModel.findByMobile(targetMobile);
    const existingRecruiterMobile = await RecruiterModel.findByMobile(targetMobile);
    if (existingCandidateMobile || existingRecruiterMobile) {
      return res.status(409).json({ error: 'This mobile number is already registered. Please use another mobile number or sign in.' });
    }
  }

  try {
    const row = await CandidateModel.create({
      ...b,
      email: targetEmail,
      mobile: targetMobile,
      passwordHash: await bcrypt.hash(b.password, 10),
    });
    respond(res, 201, 'candidate', row);
  } catch (err) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      if (detail.includes('mobile')) {
        return res.status(409).json({ error: 'This mobile number is already registered. Please use another mobile number.' });
      }
      return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
    }
    throw err;
  }
};

export const recruiterSignup = async (req, res) => {
  const msg = validateSignup(req.body || {});
  if (msg) return res.status(400).json({ error: msg });
  const b = req.body;
  const targetEmail = normEmail(b.email);
  const targetMobile = normMobile(b.mobile);

  // Check email uniqueness across both roles
  const existingCandidateEmail = await CandidateModel.findByEmail(targetEmail);
  const existingRecruiterEmail = await RecruiterModel.findByEmail(targetEmail);
  if (existingCandidateEmail || existingRecruiterEmail) {
    return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
  }

  // Check mobile uniqueness across both roles
  if (targetMobile) {
    const existingCandidateMobile = await CandidateModel.findByMobile(targetMobile);
    const existingRecruiterMobile = await RecruiterModel.findByMobile(targetMobile);
    if (existingCandidateMobile || existingRecruiterMobile) {
      return res.status(409).json({ error: 'This mobile number is already registered. Please use another mobile number or sign in.' });
    }
  }

  try {
    const row = await RecruiterModel.create({
      ...b,
      email: targetEmail,
      mobile: targetMobile,
      passwordHash: await bcrypt.hash(b.password, 10),
    });
    respond(res, 201, 'recruiter', row);
  } catch (err) {
    if (err.code === '23505') {
      const detail = err.detail || '';
      if (detail.includes('mobile')) {
        return res.status(409).json({ error: 'This mobile number is already registered. Please use another mobile number.' });
      }
      return res.status(409).json({ error: 'This email is already registered. Please sign in instead.' });
    }
    throw err;
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!emailOk(email) || !password) return res.status(400).json({ error: 'Email and password required.' });
  const e = normEmail(email);
  for (const [Model, role] of [[CandidateModel, 'candidate'], [RecruiterModel, 'recruiter']]) {
    const row = await Model.findByEmail(e);
    if (row && (await bcrypt.compare(password, row.password_hash))) return respond(res, 200, role, row);
  }
  res.status(401).json({ error: 'Invalid email or password.' });
};

export const me = async (req, res) => {
  const Model = req.user.role === 'candidate' ? CandidateModel : RecruiterModel;
  const row = await Model.findById(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  res.json({ role: req.user.role, user: publicUser(row) });
};

export const updateCandidatePathAndPlan = async (req, res) => {
  const userId = req.user?.id;
  if (!userId || req.user?.role !== 'candidate') {
    return res.status(403).json({ error: 'Candidate authorization required.' });
  }

  const { selected_path, resume_data, purchased_plan } = req.body || {};
  
  const updates = {
    updated_at: new Date().toISOString(),
  };

  if (selected_path !== undefined) {
    updates.selected_path = selected_path;
  }
  if (resume_data !== undefined) {
    updates.resume_data = resume_data;
  }
  if (purchased_plan) {
    // 30 days validity for purchased plan
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    updates.purchased_plan = {
      ...purchased_plan,
      status: 'active',
      purchased_at: new Date().toISOString(),
      expires_at: expiresAt,
    };
    updates.plan_status = 'active';
    updates.plan_expires_at = expiresAt;
  }

  const updatedCandidate = await CandidateModel.updateProfile(userId, updates);

  res.json({
    success: true,
    message: purchased_plan ? 'Plan activated successfully for 30 days!' : 'Candidate profile updated successfully.',
    user: publicUser(updatedCandidate),
  });
};

