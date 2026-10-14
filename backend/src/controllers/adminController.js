import bcrypt from 'bcryptjs';
import { AdminModel } from '../models/adminModel.js';
import { signToken, publicUser } from '../utils/token.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const emailOk = (e) => EMAIL_REGEX.test((e || '').trim());
const normEmail = (e) => (e || '').toLowerCase().trim();

export const getSetupStatus = async (_req, res) => {
  const count = await AdminModel.count();
  res.json({
    hasAdmin: count > 0,
    adminCount: count,
  });
};

export const registerAdmin = async (req, res) => {
  const count = await AdminModel.count();
  if (count > 0) {
    return res.status(403).json({
      error: 'Admin registration is closed. The primary administrator account is already set up. Please sign in.',
    });
  }

  const { name, email, password } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
  }

  const cleanEmail = normEmail(email);
  if (!emailOk(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = await AdminModel.findByEmail(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An admin with this email already exists. Please sign in.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const row = await AdminModel.create({
    name: name.trim(),
    email: cleanEmail,
    passwordHash,
    role: 'admin',
  });

  const token = signToken('admin', row);
  res.status(201).json({
    token,
    role: 'admin',
    user: publicUser(row),
    message: 'Admin account created successfully.',
  });
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = normEmail(email);
  const admin = await AdminModel.findByEmail(cleanEmail);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const token = signToken('admin', admin);
  res.json({
    token,
    role: 'admin',
    user: publicUser(admin),
    message: 'Admin signed in successfully.',
  });
};

export const getAdminProfile = async (req, res) => {
  const admin = await AdminModel.findById(req.user.id);
  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found.' });
  }
  res.json({
    role: 'admin',
    user: publicUser(admin),
  });
};

export const getAllUsers = async (_req, res) => {
  const users = await AdminModel.getAllUsers();
  res.json({
    count: users.length,
    users,
  });
};

export const deleteUser = async (req, res) => {
  const { role, id } = req.params;

  if (!['candidate', 'recruiter'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified. Must be candidate or recruiter.' });
  }

  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ error: 'Invalid user ID.' });
  }

  const deleted = await AdminModel.deleteUser(role, parsedId);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found or already deleted.' });
  }

  res.json({
    success: true,
    message: `${role === 'candidate' ? 'Candidate' : 'Recruiter'} deleted successfully.`,
    deletedId: parsedId,
    role,
  });
};

export const getStats = async (_req, res) => {
  const stats = await AdminModel.getStats();
  res.json(stats);
};
