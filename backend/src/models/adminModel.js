import { pool } from '../config/db.js';

export const AdminModel = {
  async create({ name, email, passwordHash, role = 'admin' }) {
    const { rows } = await pool.query(
      `INSERT INTO admins (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email.toLowerCase().trim(), passwordHash, role]
    );
    return rows[0];
  },

  async findByEmail(email) {
    if (!email) return null;
    const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase().trim()]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM admins WHERE id = $1', [id]);
    return rows[0];
  },

  async count() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM admins');
    return rows[0]?.count || 0;
  },

  async getAllUsers() {
    // Fetch all candidates and recruiters
    const candidatesRes = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        mobile, 
        title, 
        NULL AS company, 
        city, 
        state, 
        profile, 
        created_at, 
        'candidate' AS role 
      FROM candidates 
      ORDER BY created_at DESC
    `);

    const recruitersRes = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        mobile, 
        role_title AS title, 
        company, 
        city, 
        state, 
        profile, 
        created_at, 
        'recruiter' AS role 
      FROM recruiters 
      ORDER BY created_at DESC
    `);

    const allUsers = [...candidatesRes.rows, ...recruitersRes.rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allUsers;
  },

  async deleteUser(role, id) {
    const table = role === 'candidate' ? 'candidates' : role === 'recruiter' ? 'recruiters' : null;
    if (!table) return null;

    const { rows } = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [id]);
    return rows[0] || null;
  },

  async getStats() {
    const [cRes, rRes, aRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM candidates'),
      pool.query('SELECT COUNT(*)::int AS count FROM recruiters'),
      pool.query('SELECT COUNT(*)::int AS count FROM admins'),
    ]);

    const candidates = cRes.rows[0]?.count || 0;
    const recruiters = rRes.rows[0]?.count || 0;
    const admins = aRes.rows[0]?.count || 0;

    return {
      totalCandidates: candidates,
      totalRecruiters: recruiters,
      totalUsers: candidates + recruiters,
      totalAdmins: admins,
    };
  },
};
