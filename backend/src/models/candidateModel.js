import { pool } from '../config/db.js';

export const CandidateModel = {
  async create({ name, email, mobile, passwordHash, title, city, state, profile }) {
    const { rows } = await pool.query(
      `INSERT INTO candidates (name,email,mobile,password_hash,title,city,state,profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, email, mobile || null, passwordHash, title || null, city || null, state || null, profile || {}]
    );
    return rows[0];
  },
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM candidates WHERE email=$1', [email]);
    return rows[0];
  },
  async findByMobile(mobile) {
    if (!mobile) return null;
    const { rows } = await pool.query('SELECT * FROM candidates WHERE mobile=$1', [mobile]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM candidates WHERE id=$1', [id]);
    return rows[0];
  },
};
