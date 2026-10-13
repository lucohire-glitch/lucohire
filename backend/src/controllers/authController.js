import bcrypt from 'bcryptjs';
import { CandidateModel } from '../models/candidateModel.js';
import { RecruiterModel } from '../models/recruiterModel.js';
import { signToken, publicUser } from '../utils/token.js';

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
const normEmail = (e) => e.toLowerCase().trim();

const validateSignup = ({ name, email, password }) =>
  !name || !emailOk(email) || !password || password.length < 8
    ? 'Name, valid email and password (min 8 chars) are required.'
    : null;

const respond = (res, status, role, row) =>
  res.status(status).json({ token: signToken(role, row), role, user: publicUser(row) });

export const candidateSignup = async (req, res) => {
  const msg = validateSignup(req.body || {});
  if (msg) return res.status(400).json({ error: msg });
  const b = req.body;
  const row = await CandidateModel.create({
    ...b,
    email: normEmail(b.email),
    passwordHash: await bcrypt.hash(b.password, 10),
  });
  respond(res, 201, 'candidate', row);
};

export const recruiterSignup = async (req, res) => {
  const msg = validateSignup(req.body || {});
  if (msg) return res.status(400).json({ error: msg });
  const b = req.body;
  const row = await RecruiterModel.create({
    ...b,
    email: normEmail(b.email),
    passwordHash: await bcrypt.hash(b.password, 10),
  });
  respond(res, 201, 'recruiter', row);
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
