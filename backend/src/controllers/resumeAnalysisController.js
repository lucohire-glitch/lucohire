import { analyzeResumeWithAI } from '../services/resumeAiService.js';
import { pool } from '../config/db.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let pdfModule = null;
try {
  pdfModule = require('pdf-parse');
} catch (e) {
  console.warn('[AI RESUME] pdf-parse require skipped:', e.message);
}

export async function analyzeResume(req, res) {
  try {
    let { resume_text, resume_name, job_description, resume_base64 } = req.body || {};
    const user = req.user || null;

    if ((!resume_text || resume_text.trim().length < 30) && resume_base64 && pdfModule) {
      try {
        const cleanBase64 = resume_base64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        if (typeof pdfModule === 'function') {
          const parsed = await pdfModule(buffer);
          if (parsed?.text && parsed.text.trim().length > 30) {
            resume_text = parsed.text.trim();
          }
        } else if (pdfModule?.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const textRes = await parser.getText();
          if (textRes?.text && textRes.text.trim().length > 30) {
            resume_text = textRes.text.trim();
          }
        }
      } catch (pdfErr) {
        console.warn('[AI RESUME] pdf-parse extraction failed:', pdfErr.message);
      }
    }

    const analysis = await analyzeResumeWithAI({
      resume_text,
      resume_name,
      job_description,
      fallback_user: user,
    });

    // If user is authenticated candidate, persist resume_data in DB profile
    if (user?.id && user?.role === 'candidate') {
      try {
        await pool.query(
          `UPDATE candidates 
           SET profile = jsonb_set(COALESCE(profile, '{}'::jsonb), '{resume_data}', $1::jsonb) 
           WHERE id = $2`,
          [JSON.stringify(analysis), user.id]
        );
      } catch (dbErr) {
        console.warn('[AI RESUME] Failed to save in candidate profile:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      analysis,
    });
  } catch (err) {
    console.error('[AI RESUME] Analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze resume' });
  }
}
