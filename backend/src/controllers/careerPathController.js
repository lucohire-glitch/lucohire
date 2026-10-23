import { CareerPathModel } from '../models/careerPathModel.js';

export const getPublicPaths = async (req, res) => {
  const paths = await CareerPathModel.getAll(true);
  res.json({
    success: true,
    count: paths.length,
    paths,
  });
};

export const getAllPaths = async (req, res) => {
  const paths = await CareerPathModel.getAll(false);
  res.json({
    success: true,
    count: paths.length,
    paths,
  });
};

export const createPath = async (req, res) => {
  const { title, sub, badge, recommended, syllabus, kya, one_liner, lessons, jobs, quick_wins, sort_order, is_active } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Path title is required.' });
  }

  let parsedSyllabus = [];
  if (Array.isArray(syllabus)) {
    parsedSyllabus = syllabus.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof syllabus === 'string') {
    parsedSyllabus = syllabus.split('\n').map((s) => s.trim()).filter(Boolean);
  }

  const newPath = await CareerPathModel.create({
    title: title.trim(),
    sub: (sub || '').trim(),
    badge: (badge || '').trim(),
    recommended: Boolean(recommended),
    syllabus: parsedSyllabus,
    kya: (kya || '').trim(),
    one_liner: (one_liner || '').trim(),
    lessons: Number(lessons) || 3,
    jobs: Number(jobs) || 10000,
    quick_wins: Array.isArray(quick_wins) ? quick_wins : [],
    sort_order: Number(sort_order) || 1,
    is_active: is_active !== undefined ? Boolean(is_active) : true,
  });

  res.status(201).json({
    success: true,
    message: 'Career path created successfully.',
    path: newPath,
  });
};

export const updatePath = async (req, res) => {
  const { id } = req.params;
  const pathId = parseInt(id, 10);
  if (isNaN(pathId)) {
    return res.status(400).json({ error: 'Invalid path ID.' });
  }

  const existing = await CareerPathModel.getById(pathId);
  if (!existing) {
    return res.status(404).json({ error: 'Career path not found.' });
  }

  const { title, sub, badge, recommended, syllabus, kya, one_liner, lessons, jobs, quick_wins, sort_order, is_active } = req.body || {};

  const updates = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (sub !== undefined) updates.sub = String(sub).trim();
  if (badge !== undefined) updates.badge = String(badge).trim();
  if (recommended !== undefined) updates.recommended = Boolean(recommended);
  if (kya !== undefined) updates.kya = String(kya).trim();
  if (one_liner !== undefined) updates.one_liner = String(one_liner).trim();
  if (lessons !== undefined) updates.lessons = Number(lessons);
  if (jobs !== undefined) updates.jobs = Number(jobs);
  if (sort_order !== undefined) updates.sort_order = Number(sort_order);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);

  if (syllabus !== undefined) {
    if (Array.isArray(syllabus)) {
      updates.syllabus = syllabus.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof syllabus === 'string') {
      updates.syllabus = syllabus.split('\n').map((s) => s.trim()).filter(Boolean);
    }
  }

  if (quick_wins !== undefined) {
    updates.quick_wins = Array.isArray(quick_wins) ? quick_wins : [];
  }

  const updatedPath = await CareerPathModel.update(pathId, updates);

  res.json({
    success: true,
    message: 'Career path updated successfully.',
    path: updatedPath,
  });
};

export const deletePath = async (req, res) => {
  const { id } = req.params;
  const pathId = parseInt(id, 10);
  if (isNaN(pathId)) {
    return res.status(400).json({ error: 'Invalid path ID.' });
  }

  const existing = await CareerPathModel.getById(pathId);
  if (!existing) {
    return res.status(404).json({ error: 'Career path not found.' });
  }

  await CareerPathModel.delete(pathId);

  res.json({
    success: true,
    message: `Career path "${existing.title}" deleted successfully.`,
    deletedId: pathId,
  });
};
