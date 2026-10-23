import { pool } from '../config/db.js';

export const CareerPathModel = {
  async initTableAndSeed() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_paths (
        id SERIAL PRIMARY KEY,
        path_key TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        sub TEXT,
        badge TEXT,
        recommended BOOLEAN DEFAULT false,
        syllabus JSONB DEFAULT '[]'::jsonb,
        kya TEXT,
        one_liner TEXT,
        lessons INTEGER DEFAULT 3,
        jobs INTEGER DEFAULT 12700,
        quick_wins JSONB DEFAULT '[]'::jsonb,
        sort_order INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    const { rows } = await pool.query('SELECT COUNT(*) as count FROM career_paths');
    if (parseInt(rows[0].count, 10) === 0) {
      const defaultPaths = [
        {
          path_key: 'p1',
          title: 'Abhi 3-6 LPA job chahiye',
          sub: '0-30 din me calls badhani hai',
          badge: 'Fast Track',
          recommended: true,
          syllabus: JSON.stringify(['TypeScript (6 hrs)', 'Next.js (1 day)', 'Tailwind (4 hrs)']),
          kya: '+12,700 jobs unlock · Resume score 64→82 · Expected calls 3x',
          one_liner: 'TypeScript + Next.js + Tailwind → 3x calls',
          lessons: 3,
          jobs: 12700,
          quick_wins: JSON.stringify([
            { n: '1', skill: 'TypeScript', time: '6 hours', jobs: '+7,200 unlock', line: 'Migrated 3 components to TypeScript' },
            { n: '2', skill: 'Next.js', time: '1 day', jobs: '+3,100 unlock', line: 'Built e-commerce with Next.js, SSR 40% faster' },
            { n: '3', skill: 'Tailwind CSS', time: '4 hours', jobs: '+2,400 unlock', line: 'Styled UI with Tailwind, reduced CSS by 60%' }
          ]),
          sort_order: 1,
          is_active: true
        },
        {
          path_key: 'p2',
          title: '8-12 LPA pe jump karna hai',
          sub: '2-3 mahine • product me jana hai',
          badge: 'Most Popular',
          recommended: false,
          syllabus: JSON.stringify(['Advanced React (Server Components)', 'System Design Basics', 'Performance Optimization']),
          kya: 'Product companies me shortlist · Avg 10-14 LPA · System Design questions clear',
          one_liner: 'RSC + System Design → Product companies shortlist',
          lessons: 6,
          jobs: 9400,
          quick_wins: JSON.stringify([
            { n: '1', skill: 'React Server Components', time: '1 day', jobs: '2,800 jobs · +58%', line: 'Rebuilt a data-heavy page with React Server Components' },
            { n: '2', skill: 'System Design Basics', time: '50 min', jobs: '9,100 jobs at 15 LPA+', line: 'Designed scalable notification flow for 10k users' },
            { n: '3', skill: 'Performance Optimization', time: '35 min', jobs: '5,600 jobs at 15 LPA+', line: 'Improved LCP from 3.2s to 1.4s' }
          ]),
          sort_order: 2,
          is_active: true
        },
        {
          path_key: 'p3',
          title: '15 LPA+ High Paid banna hai',
          sub: 'Senior tag • Top startups',
          badge: 'High Salary',
          recommended: false,
          syllabus: JSON.stringify(['System Design Deep', 'GenAI Integration (LLM APIs, RAG)', 'DSA Patterns for frontend']),
          kya: 'Razorpay, CRED, Swiggy type companies · 15-25 LPA · Senior tag',
          one_liner: 'System Design + GenAI → 15-25 LPA',
          lessons: 8,
          jobs: 4100,
          quick_wins: JSON.stringify([
            { n: '1', skill: 'GenAI Integration (LLM APIs, RAG)', time: '1 day', jobs: '4,100 jobs · +340%', line: 'Integrated OpenAI API for auto-summary, saved 2 hrs/week per user' },
            { n: '2', skill: 'System Design Deep', time: '2 days', jobs: '15-25 LPA · senior-tag roles', line: 'Designed a horizontally-scalable system to handle 1M+ users' },
            { n: '3', skill: 'DSA Patterns for frontend', time: '3 days', jobs: 'Core interview round', line: 'Practiced pattern-based problems for Razorpay/CRED/Swiggy-type rounds' }
          ]),
          sort_order: 3,
          is_active: true
        },
        {
          path_key: 'p4',
          title: '2030 tak job secure karni hai',
          sub: 'AI replace na kare',
          badge: 'Future Safe',
          recommended: false,
          syllabus: JSON.stringify(['AI Tools (Cursor / Copilot)', 'Full-stack basics (Node + DB)', 'Web Performance & Security']),
          kya: 'AI replace nahi karega · Full-stack + AI = safe for next 5 years',
          one_liner: 'AI Tools + Full-stack → 5 saal safe',
          lessons: 10,
          jobs: 6800,
          quick_wins: JSON.stringify([
            { n: '1', skill: 'AI Tools (Cursor / Copilot)', time: '2 hours', jobs: '2026 roadmap priority', line: 'Used AI-assisted tooling (Cursor/Copilot) to ship features faster' },
            { n: '2', skill: 'Full-stack basics (Node + DB)', time: '1 day', jobs: '2028–30 roadmap priority', line: 'Built a full-stack feature end-to-end with Node.js and a database' },
            { n: '3', skill: 'Web Performance & Security', time: '4 hours', jobs: '2027 roadmap priority', line: 'Audited and fixed core web vitals and key security gaps' }
          ]),
          sort_order: 4,
          is_active: true
        }
      ];

      for (const p of defaultPaths) {
        await pool.query(
          `INSERT INTO career_paths (path_key, title, sub, badge, recommended, syllabus, kya, one_liner, lessons, jobs, quick_wins, sort_order, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (path_key) DO NOTHING`,
          [p.path_key, p.title, p.sub, p.badge, p.recommended, p.syllabus, p.kya, p.one_liner, p.lessons, p.jobs, p.quick_wins, p.sort_order, p.is_active]
        );
      }
    }
  },

  async getAll(activeOnly = false) {
    let query = 'SELECT * FROM career_paths WHERE 1=1';
    const params = [];

    if (activeOnly) {
      params.push(true);
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY sort_order ASC, id ASC';
    const { rows } = await pool.query(query, params);
    return rows;
  },

  async getById(id) {
    const { rows } = await pool.query('SELECT * FROM career_paths WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(data) {
    const {
      title,
      sub = '',
      badge = '',
      recommended = false,
      syllabus = [],
      kya = '',
      one_liner = '',
      lessons = 3,
      jobs = 10000,
      quick_wins = [],
      sort_order = 1,
      is_active = true,
    } = data;

    const path_key = data.path_key || `path_${Date.now()}`;
    const syllabusJson = typeof syllabus === 'string' ? syllabus : JSON.stringify(syllabus || []);
    const winsJson = typeof quick_wins === 'string' ? quick_wins : JSON.stringify(quick_wins || []);

    const { rows } = await pool.query(
      `INSERT INTO career_paths (path_key, title, sub, badge, recommended, syllabus, kya, one_liner, lessons, jobs, quick_wins, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        path_key,
        title,
        sub,
        badge,
        Boolean(recommended),
        syllabusJson,
        kya,
        one_liner,
        Number(lessons) || 3,
        Number(jobs) || 10000,
        winsJson,
        Number(sort_order) || 1,
        Boolean(is_active)
      ]
    );
    return rows[0];
  },

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const title = data.title !== undefined ? data.title : existing.title;
    const sub = data.sub !== undefined ? data.sub : existing.sub;
    const badge = data.badge !== undefined ? data.badge : existing.badge;
    const recommended = data.recommended !== undefined ? Boolean(data.recommended) : existing.recommended;
    const kya = data.kya !== undefined ? data.kya : existing.kya;
    const one_liner = data.one_liner !== undefined ? data.one_liner : existing.one_liner;
    const lessons = data.lessons !== undefined ? Number(data.lessons) : existing.lessons;
    const jobs = data.jobs !== undefined ? Number(data.jobs) : existing.jobs;
    const sort_order = data.sort_order !== undefined ? Number(data.sort_order) : existing.sort_order;
    const is_active = data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active;

    let syllabusJson = existing.syllabus;
    if (data.syllabus !== undefined) {
      syllabusJson = typeof data.syllabus === 'string' ? data.syllabus : JSON.stringify(data.syllabus || []);
    }

    let winsJson = existing.quick_wins;
    if (data.quick_wins !== undefined) {
      winsJson = typeof data.quick_wins === 'string' ? data.quick_wins : JSON.stringify(data.quick_wins || []);
    }

    const { rows } = await pool.query(
      `UPDATE career_paths
       SET title = $1, sub = $2, badge = $3, recommended = $4,
           syllabus = $5, kya = $6, one_liner = $7, lessons = $8,
           jobs = $9, quick_wins = $10, sort_order = $11, is_active = $12,
           updated_at = now()
       WHERE id = $13
       RETURNING *`,
      [
        title,
        sub,
        badge,
        recommended,
        syllabusJson,
        kya,
        one_liner,
        lessons,
        jobs,
        winsJson,
        sort_order,
        is_active,
        id
      ]
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM career_paths WHERE id = $1', [id]);
    return rowCount > 0;
  }
};
