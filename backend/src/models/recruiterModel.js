import { pool } from '../config/db.js';

export const RecruiterModel = {
  async create({ name, email, mobile, passwordHash, roleTitle, company, city, state, profile }) {
    const { rows } = await pool.query(
      `INSERT INTO recruiters (name,email,mobile,password_hash,role_title,company,city,state,profile)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, email, mobile || null, passwordHash, roleTitle || null, company || null, city || null, state || null, profile || {}]
    );
    return rows[0];
  },
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM recruiters WHERE email=$1', [email]);
    return rows[0];
  },
  async findByMobile(mobile) {
    if (!mobile) return null;
    const { rows } = await pool.query('SELECT * FROM recruiters WHERE mobile=$1', [mobile]);
    return rows[0];
  },
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM recruiters WHERE id=$1', [id]);
    return rows[0];
  },
};
