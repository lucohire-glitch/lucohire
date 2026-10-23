import { PlanModel } from '../models/planModel.js';

export const getPublicPlans = async (req, res) => {
  const { category } = req.query;
  const plans = await PlanModel.getAll(true, category || null);
  res.json({
    success: true,
    count: plans.length,
    plans,
  });
};

export const getAllPlans = async (req, res) => {
  const { category } = req.query;
  const plans = await PlanModel.getAll(false, category || null);

  const stats = {
    total: plans.length,
    freelancer: plans.filter((p) => p.category === 'freelancer').length,
    recruiter: plans.filter((p) => p.category === 'recruiter').length,
    resume: plans.filter((p) => p.category === 'resume').length,
    active: plans.filter((p) => p.is_active).length,
  };

  res.json({
    success: true,
    stats,
    plans,
  });
};

export const createPlan = async (req, res) => {
  const { name, category, price_amount, price_unit, description, features, badge, cta_text, why_text, is_popular, is_active, sort_order } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Plan name is required.' });
  }

  if (!price_amount || typeof price_amount !== 'string' || !price_amount.trim()) {
    return res.status(400).json({ error: 'Price amount is required (e.g. "₹49").' });
  }

  const validCategories = ['freelancer', 'recruiter', 'resume'];
  const planCategory = validCategories.includes(category) ? category : 'freelancer';

  let parsedFeatures = [];
  if (Array.isArray(features)) {
    parsedFeatures = features.map((f) => String(f).trim()).filter(Boolean);
  } else if (typeof features === 'string') {
    parsedFeatures = features.split('\n').map((f) => f.trim()).filter(Boolean);
  }

  const newPlan = await PlanModel.create({
    name: name.trim(),
    category: planCategory,
    price_amount: price_amount.trim(),
    price_unit: (price_unit || '/month').trim(),
    description: (description || '').trim(),
    features: parsedFeatures,
    badge: (badge || '').trim(),
    cta_text: (cta_text || 'Choose Plan').trim(),
    why_text: (why_text || '').trim(),
    is_popular: Boolean(is_popular),
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    sort_order: Number(sort_order) || 0,
  });

  res.status(201).json({
    success: true,
    message: 'Plan created successfully.',
    plan: newPlan,
  });
};

export const updatePlan = async (req, res) => {
  const { id } = req.params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID.' });
  }

  const existing = await PlanModel.getById(planId);
  if (!existing) {
    return res.status(404).json({ error: 'Plan not found.' });
  }

  const { name, category, price_amount, price_unit, description, features, badge, cta_text, why_text, is_popular, is_active, sort_order } = req.body || {};

  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (category !== undefined) updates.category = String(category).trim();
  if (price_amount !== undefined) updates.price_amount = String(price_amount).trim();
  if (price_unit !== undefined) updates.price_unit = String(price_unit).trim();
  if (description !== undefined) updates.description = String(description).trim();
  if (badge !== undefined) updates.badge = String(badge).trim();
  if (cta_text !== undefined) updates.cta_text = String(cta_text).trim();
  if (why_text !== undefined) updates.why_text = String(why_text).trim();
  if (is_popular !== undefined) updates.is_popular = Boolean(is_popular);
  if (is_active !== undefined) updates.is_active = Boolean(is_active);
  if (sort_order !== undefined) updates.sort_order = Number(sort_order);

  if (features !== undefined) {
    if (Array.isArray(features)) {
      updates.features = features.map((f) => String(f).trim()).filter(Boolean);
    } else if (typeof features === 'string') {
      updates.features = features.split('\n').map((f) => f.trim()).filter(Boolean);
    }
  }

  const updatedPlan = await PlanModel.update(planId, updates);

  res.json({
    success: true,
    message: 'Plan updated successfully.',
    plan: updatedPlan,
  });
};

export const deletePlan = async (req, res) => {
  const { id } = req.params;
  const planId = parseInt(id, 10);
  if (isNaN(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID.' });
  }

  const existing = await PlanModel.getById(planId);
  if (!existing) {
    return res.status(404).json({ error: 'Plan not found or already deleted.' });
  }

  await PlanModel.delete(planId);

  res.json({
    success: true,
    message: `Plan "${existing.name}" deleted successfully.`,
    deletedId: planId,
  });
};
