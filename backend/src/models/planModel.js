import { pool } from '../config/db.js';

export const PlanModel = {
  async initTableAndSeed() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'freelancer',
        price_amount TEXT NOT NULL,
        price_unit TEXT NOT NULL DEFAULT '/month',
        description TEXT,
        features JSONB DEFAULT '[]'::jsonb,
        badge TEXT,
        cta_text TEXT DEFAULT 'Choose Plan',
        why_text TEXT,
        is_popular BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Check if plans exist; if empty, seed default plans
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM plans');
    if (parseInt(rows[0].count, 10) === 0) {
      const defaultPlans = [
        {
          name: 'Free Starter',
          category: 'freelancer',
          price_amount: '₹0',
          price_unit: '/forever',
          description: 'Create your full profile and show up in matching search.',
          features: JSON.stringify([
            'Create your full profile',
            'Show up in search & get notified of matching requirements',
            'Accept requirements & message clients',
            'Unlimited applications'
          ]),
          badge: '',
          cta_text: 'Get Started Free',
          why_text: '<b>Free</b> gets you listed and matched.',
          is_popular: false,
          is_active: true,
          sort_order: 1
        },
        {
          name: 'LucoHire Pro',
          category: 'freelancer',
          price_amount: '₹49',
          price_unit: '/month',
          description: 'Move to the top of category search and clear your WhatsApp lead cap for the month.',
          features: JSON.stringify([
            'Verified badge — ID, payment & portfolio checked',
            'Profile boost — placed above unverified profiles',
            'Priority on new matching requirements',
            'Unlimited WhatsApp leads, no monthly cap',
            'Platform fee drops from 10% to 5%'
          ]),
          badge: 'RECOMMENDED',
          cta_text: 'Get Verified — ₹49/month',
          why_text: '<b>Verified + Boosted</b> gets you picked first.',
          is_popular: true,
          is_active: true,
          sort_order: 2
        },
        {
          name: 'Job-Ready FastTrack',
          category: 'resume',
          price_amount: '₹499',
          price_unit: 'one-time',
          description: 'Unlock full resume diagnostics, line-by-line ATS rewrites, and guaranteed recruiter scan fixes.',
          features: JSON.stringify([
            'Full ATS-optimised resume rewrite — ready to send today',
            'The recruiter full 6-second scan & diagnosis verdict',
            'Every weak bullet rewritten line-by-line with numbers',
            'Missing JD keywords & ATS parsing issue fixes',
            'Personalized 30-day salary-boosting skill roadmap'
          ]),
          badge: 'BEST VALUE',
          cta_text: 'Unlock Full Report — ₹499',
          why_text: '<b>One-time</b> · Guaranteed ATS pass rate boost.',
          is_popular: true,
          is_active: true,
          sort_order: 1
        },
        {
          name: 'Recruiter Free',
          category: 'recruiter',
          price_amount: '₹0',
          price_unit: '/forever',
          description: 'Post unlimited requirements and search our full verified talent database.',
          features: JSON.stringify([
            'Post unlimited requirements',
            'Search & browse every profile',
            'Open full profiles, no limit',
            'Message your first 4 freelancers per requirement'
          ]),
          badge: '',
          cta_text: 'Start Free Hiring',
          why_text: '<b>Free</b> lets you browse everyone.',
          is_popular: false,
          is_active: true,
          sort_order: 1
        },
        {
          name: 'Recruiter Premium',
          category: 'recruiter',
          price_amount: '₹1,499',
          price_unit: '/month',
          description: 'AI-assisted hiring with unlimited direct candidate outreach and dedicated support.',
          features: JSON.stringify([
            'Unlimited messages to freelancers',
            'AI-shortlisted top 5–6 matches per requirement',
            'Priority support & direct phone assistance',
            'Direct WhatsApp contact access'
          ]),
          badge: 'POPULAR',
          cta_text: 'Upgrade ₹1,499/month',
          why_text: '<b>Premium</b> tells you exactly who to message first.',
          is_popular: true,
          is_active: true,
          sort_order: 2
        }
      ];

      for (const p of defaultPlans) {
        await pool.query(
          `INSERT INTO plans (name, category, price_amount, price_unit, description, features, badge, cta_text, why_text, is_popular, is_active, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [p.name, p.category, p.price_amount, p.price_unit, p.description, p.features, p.badge, p.cta_text, p.why_text, p.is_popular, p.is_active, p.sort_order]
        );
      }
    }
  },

  async getAll(activeOnly = false, category = null) {
    let query = 'SELECT * FROM plans WHERE 1=1';
    const params = [];

    if (activeOnly) {
      params.push(true);
      query += ` AND is_active = $${params.length}`;
    }

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY category ASC, sort_order ASC, id ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getById(id) {
    const { rows } = await pool.query('SELECT * FROM plans WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const {
      name,
      category = 'freelancer',
      price_amount,
      price_unit = '/month',
      description = '',
      features = [],
      badge = '',
      cta_text = 'Choose Plan',
      why_text = '',
      is_popular = false,
      is_active = true,
      sort_order = 0,
    } = data;

    const featuresJson = typeof features === 'string' ? features : JSON.stringify(features || []);

    const { rows } = await pool.query(
      `INSERT INTO plans (name, category, price_amount, price_unit, description, features, badge, cta_text, why_text, is_popular, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        name,
        category,
        price_amount,
        price_unit,
        description,
        featuresJson,
        badge,
        cta_text,
        why_text,
        Boolean(is_popular),
        Boolean(is_active),
        Number(sort_order) || 0,
      ]
    );
    return rows[0];
  },

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const name = data.name !== undefined ? data.name : existing.name;
    const category = data.category !== undefined ? data.category : existing.category;
    const price_amount = data.price_amount !== undefined ? data.price_amount : existing.price_amount;
    const price_unit = data.price_unit !== undefined ? data.price_unit : existing.price_unit;
    const description = data.description !== undefined ? data.description : existing.description;
    const badge = data.badge !== undefined ? data.badge : existing.badge;
    const cta_text = data.cta_text !== undefined ? data.cta_text : existing.cta_text;
    const why_text = data.why_text !== undefined ? data.why_text : existing.why_text;
    const is_popular = data.is_popular !== undefined ? Boolean(data.is_popular) : existing.is_popular;
    const is_active = data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active;
    const sort_order = data.sort_order !== undefined ? Number(data.sort_order) : existing.sort_order;

    let featuresJson = existing.features;
    if (data.features !== undefined) {
      featuresJson = typeof data.features === 'string' ? data.features : JSON.stringify(data.features || []);
    }

    const { rows } = await pool.query(
      `UPDATE plans
       SET name = $1, category = $2, price_amount = $3, price_unit = $4,
           description = $5, features = $6, badge = $7, cta_text = $8,
           why_text = $9, is_popular = $10, is_active = $11, sort_order = $12,
           updated_at = now()
       WHERE id = $13
       RETURNING *`,
      [
        name,
        category,
        price_amount,
        price_unit,
        description,
        featuresJson,
        badge,
        cta_text,
        why_text,
        is_popular,
        is_active,
        sort_order,
        id,
      ]
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM plans WHERE id = $1', [id]);
    return rowCount > 0;
  },
};
