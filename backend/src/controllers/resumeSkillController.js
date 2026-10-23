import { ResumeSkillModel } from '../models/resumeSkillModel.js';

export const getPublicSkills = async (req, res) => {
  try {
    await ResumeSkillModel.initTableAndSeed();
    const rows = await ResumeSkillModel.getAllActive();
    const rising = rows.filter((r) => r.category === 'rising');
    const keywords = rows.filter((r) => r.category === 'keyword');

    res.json({
      success: true,
      count: rows.length,
      rising,
      keywords,
      all: rows,
    });
  } catch (err) {
    console.error('Error fetching public resume skills:', err);
    res.status(500).json({ error: 'Failed to load resume skills' });
  }
};

export const getAdminSkills = async (req, res) => {
  try {
    await ResumeSkillModel.initTableAndSeed();
    const rows = await ResumeSkillModel.getAllAdmin();
    res.json({
      success: true,
      count: rows.length,
      skills: rows,
    });
  } catch (err) {
    console.error('Error fetching admin resume skills:', err);
    res.status(500).json({ error: 'Failed to load skills for admin' });
  }
};

export const createSkill = async (req, res) => {
  try {
    const { category, skill_name, trend, jobs, salary, learn_time, note, is_active, sort_order } = req.body;
    if (!category || !skill_name) {
      return res.status(400).json({ error: 'category and skill_name are required' });
    }

    const created = await ResumeSkillModel.create({
      category,
      skill_name,
      trend,
      jobs,
      salary,
      learn_time,
      note,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order ? parseInt(sort_order, 10) : 1,
    });

    res.status(201).json({
      success: true,
      message: 'Resume skill / keyword added successfully',
      skill: created,
    });
  } catch (err) {
    console.error('Error creating resume skill:', err);
    res.status(500).json({ error: 'Failed to create resume skill' });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await ResumeSkillModel.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      success: true,
      message: 'Resume skill / keyword updated successfully',
      skill: updated,
    });
  } catch (err) {
    console.error('Error updating resume skill:', err);
    res.status(500).json({ error: 'Failed to update resume skill' });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ResumeSkillModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({
      success: true,
      message: 'Resume skill / keyword deleted successfully',
      deletedId: id,
    });
  } catch (err) {
    console.error('Error deleting resume skill:', err);
    res.status(500).json({ error: 'Failed to delete resume skill' });
  }
};
