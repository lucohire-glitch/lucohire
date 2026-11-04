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

  async getAllSubscriptions() {
    const { rows } = await pool.query(`
      SELECT 
        p.id,
        p.user_id,
        COALESCE(p.user_email, c.email, r.email, 'guest-checkout@lucohire.com') AS user_email,
        COALESCE(p.user_role, CASE WHEN c.id IS NOT NULL THEN 'candidate' WHEN r.id IS NOT NULL THEN 'recruiter' ELSE 'user' END) AS user_role,
        p.plan_id,
        p.plan_name,
        p.amount,
        p.currency,
        p.razorpay_order_id,
        p.razorpay_payment_id,
        p.razorpay_signature,
        p.status,
        p.receipt,
        p.created_at,
        p.updated_at,
        COALESCE(c.name, r.name, CASE WHEN p.user_email IS NOT NULL AND p.user_email != '' THEN split_part(p.user_email, '@', 1) ELSE 'Guest Customer' END) AS user_name,
        COALESCE(c.mobile, r.mobile, '') AS user_mobile,
        COALESCE(r.company, '') AS company_name
      FROM payments p
      LEFT JOIN candidates c ON (p.user_id = c.id OR (p.user_email IS NOT NULL AND LOWER(p.user_email) = LOWER(c.email)))
      LEFT JOIN recruiters r ON (p.user_id = r.id OR (p.user_email IS NOT NULL AND LOWER(p.user_email) = LOWER(r.email)))
      ORDER BY p.created_at DESC
    `);
    return rows;
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

  async getSetting(key, defaultValue = null) {
    try {
      const { rows } = await pool.query('SELECT value FROM site_settings WHERE key = $1', [key]);
      if (rows.length > 0 && rows[0].value !== undefined) {
        return rows[0].value;
      }
      return defaultValue;
    } catch (err) {
      console.warn('AdminModel.getSetting fallback:', err.message);
      return defaultValue;
    }
  },

  async setSetting(key, value) {
    try {
      const { rows } = await pool.query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = now()
         RETURNING *`,
        [key, JSON.stringify(value)]
      );
      return rows[0]?.value;
    } catch (err) {
      console.error('AdminModel.setSetting error:', err);
      throw err;
    }
  },
};
