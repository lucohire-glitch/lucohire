import { pool } from '../config/db.js';

export const ResumeSkillModel = {
  async initTableAndSeed() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS resume_skills (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL, -- 'rising' | 'keyword' | 'outdated' | 'fading'
        skill_name VARCHAR(150) NOT NULL,
        trend VARCHAR(50),
        jobs VARCHAR(100),
        salary VARCHAR(100),
        learn_time VARCHAR(100),
        note TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTableQuery);

    // Check count and seed if empty
    const checkRes = await pool.query('SELECT COUNT(*) FROM resume_skills');
    const count = parseInt(checkRes.rows[0].count, 10);

    if (count === 0) {
      const seedItems = [
        // Skills on the rise
        {
          category: 'rising',
          skill_name: 'Next.js 14 / App Router',
          trend: '+41%',
          jobs: '6,200 jobs',
          salary: '14-18 LPA',
          learn_time: '1 day',
          note: 'High demand in modern full-stack web applications',
          sort_order: 1,
        },
        {
          category: 'rising',
          skill_name: 'TypeScript',
          trend: '+33%',
          jobs: '12,400 jobs',
          salary: '16-22 LPA',
          learn_time: '6 hours',
          note: 'Essential type-safety standard across top tech teams',
          sort_order: 2,
        },
        {
          category: 'rising',
          skill_name: 'GenAI Integration (LLM APIs, RAG)',
          trend: '+340%',
          jobs: '4,100 jobs',
          salary: '22-30 LPA',
          learn_time: '1 day',
          note: 'Fastest growing AI engineering skillset in 2026',
          sort_order: 3,
        },
        {
          category: 'rising',
          skill_name: 'React Server Components',
          trend: '+58%',
          jobs: '2,800 jobs',
          salary: '15-20 LPA',
          learn_time: '1 day',
          note: 'High performance data-fetching for React apps',
          sort_order: 4,
        },
        // JD match missing keywords
        {
          category: 'keyword',
          skill_name: 'Figma Variables',
          trend: '+85%',
          jobs: '5,100 jobs',
          salary: '',
          learn_time: '2 hours',
          note: 'Design token and multi-theme management standard',
          sort_order: 1,
        },
        {
          category: 'keyword',
          skill_name: 'Design Systems',
          trend: '+65%',
          jobs: '8,900 jobs',
          salary: '',
          learn_time: '4 hours',
          note: 'Enterprise UI scalability and reusable components',
          sort_order: 2,
        },
        {
          category: 'keyword',
          skill_name: 'A/B Testing',
          trend: '+45%',
          jobs: '4,200 jobs',
          salary: '',
          learn_time: '3 hours',
          note: 'Product experimentation and user conversion audit',
          sort_order: 3,
        },
        {
          category: 'keyword',
          skill_name: 'Accessibility (WCAG)',
          trend: '+92%',
          jobs: '3,800 jobs',
          salary: '',
          learn_time: '2 hours',
          note: 'Global compliance and inclusive interface design',
          sort_order: 4,
        },
      ];

      for (const item of seedItems) {
        await pool.query(
          `INSERT INTO resume_skills 
            (category, skill_name, trend, jobs, salary, learn_time, note, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            item.category,
            item.skill_name,
            item.trend,
            item.jobs,
            item.salary,
            item.learn_time,
            item.note,
            item.sort_order,
          ]
        );
      }
      console.log('Seeded resume_skills successfully with 8 initial skills and keywords.');
    }
  },

  async getAllActive() {
    const res = await pool.query(
      `SELECT * FROM resume_skills WHERE is_active = true ORDER BY sort_order ASC, id ASC`
    );
    return res.rows;
  },

  async getAllAdmin() {
    const res = await pool.query(
      `SELECT * FROM resume_skills ORDER BY category ASC, sort_order ASC, id ASC`
    );
    return res.rows;
  },

  async getById(id) {
    const res = await pool.query(`SELECT * FROM resume_skills WHERE id = $1`, [id]);
    return res.rows[0] || null;
  },

  async create(data) {
    const {
      category,
      skill_name,
      trend = '',
      jobs = '',
      salary = '',
      learn_time = '',
      note = '',
      is_active = true,
      sort_order = 1,
    } = data;

    const res = await pool.query(
      `INSERT INTO resume_skills 
        (category, skill_name, trend, jobs, salary, learn_time, note, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [category, skill_name, trend, jobs, salary, learn_time, note, is_active, sort_order]
    );
    return res.rows[0];
  },

  async update(id, data) {
    const allowed = [
      'category',
      'skill_name',
      'trend',
      'jobs',
      'salary',
      'learn_time',
      'note',
      'is_active',
      'sort_order',
    ];
    const updates = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(data[key]);
        idx++;
      }
    }

    if (updates.length === 0) return await this.getById(id);

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await pool.query(
      `UPDATE resume_skills SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await pool.query(
      `DELETE FROM resume_skills WHERE id = $1 RETURNING id`,
      [id]
    );
    return res.rows[0] || null;
  },
};
