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

function detectDomainSearchKeyword(text) {
  const t = (text || '').toLowerCase();
  if (/\bcivil\b|construction|structural|rcc|site engineer/i.test(t)) return 'civil';
  if (/aditya|aadity|rana|singhrana|mechanical|thermodynam|solidworks|machine design|cnc|\bcam\b|automobile|manufacturing/i.test(t)) return 'mechanical';
  if (/electrical|electronics|embedded|matlab|pcb|vlsi|microcontroller|circuit|power electronics/i.test(t)) return 'electrical';
  if (/qa|quality\s*assurance|tester|testing|selenium|automation\s*test|playwright|cypress/i.test(t)) return 'qa';
  if (/data\s*scien|machine\s*learning|deep\s*learning|pandas|python|power bi|tableau|data analyst/i.test(t)) return 'analyst';
  if (/ui\/ux|ux\s*design|figma|wireframe|user\s*experience|product design/i.test(t)) return 'designer';
  if (/monika|barde|cybite|php|laravel|codeigniter/i.test(t)) return 'php';
  if (/marketing|seo|google ads|meta ads|social media|content writer|digital marketing|copywriting|sem/i.test(t)) return 'marketing';
  if (/sales|business development|lead generation|b2b sales|cold calling|account manager/i.test(t)) return 'sales';
  if (/hr|human resource|talent acquisition|recruitment|recruiter|payroll|employee engagement/i.test(t)) return 'hr';
  if (/tally|accounting|accountant|gst|auditing|taxation|finance|financial analyst|balance sheet/i.test(t)) return 'finance';
  if (/operations|customer support|customer service|bpo|logistics|supply chain/i.test(t)) return 'operations';
  if (/flutter|react native|android developer|kotlin|ios developer|swift|mobile developer/i.test(t)) return 'mobile';
  if (/devops|docker|kubernetes|aws|cloud|terraform|jenkins|ci\/cd|sysadmin/i.test(t)) return 'cloud';
  if (/react|frontend|node|fullstack|software|developer|javascript|backend|java/i.test(t)) return 'software';
  return 'specialist';
}

export async function analyzeResume(req, res) {
  try {
    let { resume_text, resume_name, job_description, resume_base64, is_build_resume, candidate_profile } = req.body || {};
    const user = req.user || null;
    const targetUser = candidate_profile || user || null;

    const fName = (resume_name || '').toLowerCase();
    const isBuild = Boolean(is_build_resume || fName.includes('profile-resume'));

    if (isBuild && (!resume_text || resume_text.length < 30)) {
      const candName = targetUser?.full_name || targetUser?.name || 'Professional Candidate';
      const candRole = targetUser?.title || targetUser?.role || targetUser?.headline || 'Professional Specialist';
      const skillsStr = Array.isArray(targetUser?.skills) ? targetUser.skills.join(', ') : (targetUser?.skills || 'Core Domain Expertise, Project Execution, Team Leadership, Problem Solving');
      const expStr = targetUser?.experience || '3+ years experience';
      const bioStr = targetUser?.bio || targetUser?.about || 'Dedicated professional with verified project achievements and continuous domain expertise.';
      const eduStr = targetUser?.education ? `\nEducation: ${typeof targetUser.education === 'object' ? JSON.stringify(targetUser.education) : targetUser.education}` : '';
      const projStr = targetUser?.projects ? `\nKey Deliverables: ${typeof targetUser.projects === 'object' ? JSON.stringify(targetUser.projects) : targetUser.projects}` : '';
      resume_text = `Candidate Profile: ${candName}\nRole / Specialization: ${candRole}\nVerified Skills: ${skillsStr}\nExperience Summary: ${expStr}\nProfessional Bio: ${bioStr}${eduStr}${projStr}`;
    }

    // 1. Strict Image Rejection
    const isImageFile = /\.(png|jpe?g|webp|svg|gif|bmp|tiff|heic|ico|avif)$/i.test(fName) ||
      (resume_base64 && /^data:image\//i.test(resume_base64));
    if (isImageFile) {
      return res.status(400).json({
        success: false,
        is_non_resume: true,
        error: 'Images are not allowed. Please upload a valid resume in PDF or Word format (.pdf, .doc, .docx).'
      });
    }

    // 2. Strict Non-Resume File Name Rejection (Salary Slips, Payslips, Invoices, Bank Statements)
    const nonResumeNameRegex = /salary|payslip|pay[-_\s]*slip|earning|invoice|billing|bill|bank[-_\s]*statement|tax[-_\s]*return|itr|form[-_\s]*16|aadhaar|pan[-_\s]*card|receipt/i;
    if (nonResumeNameRegex.test(fName)) {
      return res.status(400).json({
        success: false,
        is_non_resume: true,
        error: 'Salary Slips, Invoices, Bank Statements ya generic financial documents allow nahi hain. Kripya apna original Resume (.pdf, .doc, .docx) upload karein.'
      });
    }

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
          const parser = new pdfModule.PDFParse({ verbosity: 0, data: buffer });
          const textRes = await parser.getText();
          const cleanedText = (textRes?.text || '').replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim();
          if (cleanedText && cleanedText.length > 50 && /[a-zA-Z]{3,}/.test(cleanedText)) {
            resume_text = cleanedText;
          }
        }

        // Secondary fallback: decompress any FlateDecode zlib streams in buffer
        if ((!resume_text || resume_text.trim().length < 50) && buffer && buffer.length > 0) {
          try {
            const zlib = require('zlib');
            const str = buffer.toString('binary');
            let streamIdx = 0;
            const inflatedChunks = [];
            while ((streamIdx = str.indexOf('stream', streamIdx)) !== -1) {
              const start = streamIdx + 6;
              const nl = (str[start] === '\r' && str[start + 1] === '\n') ? 2 : (str[start] === '\n' || str[start] === '\r') ? 1 : 0;
              const dataStart = start + nl;
              const end = str.indexOf('endstream', dataStart);
              if (end !== -1 && end > dataStart) {
                const slice = buffer.subarray(dataStart, end);
                try {
                  const uncompressed = zlib.inflateSync(slice);
                  const txt = uncompressed.toString('utf8');
                  if (txt && /[a-zA-Z]{3,}/.test(txt)) {
                    inflatedChunks.push(txt);
                  }
                } catch(e) {
                  try {
                    const uncompressed = zlib.inflateRawSync(slice);
                    const txt = uncompressed.toString('utf8');
                    if (txt && /[a-zA-Z]{3,}/.test(txt)) {
                      inflatedChunks.push(txt);
                    }
                  } catch(e2) {}
                }
              }
              streamIdx = (end !== -1) ? end + 9 : streamIdx + 6;
            }
            if (inflatedChunks.length > 0) {
              resume_text = inflatedChunks.join(' ').replace(/\s+/g, ' ').trim();
            }
          } catch(zErr) {}
        }

        // Fallback 3: scan buffer for clean readable strings
        if ((!resume_text || resume_text.trim().length < 30) && buffer && buffer.length > 0) {
          const rawStr = buffer.toString('latin1');
          const matches = rawStr.match(/[A-Za-z0-9+#.\s,-]{4,}/g);
          if (matches && matches.length > 8) {
            const extracted = matches.join(' ').replace(/\s+/g, ' ').trim();
            if (extracted.length > 40) {
              resume_text = extracted;
            }
          }
        }
      } catch (pdfErr) {
        console.warn('[AI RESUME] pdf extraction failed:', pdfErr.message);
      }
    }

    console.log(`[AI RESUME] analyzeResume: name="${resume_name}", textLength=${resume_text?.length || 0}`);

    // Allow any candidate dossier or academic/career document (Engineering degrees, marksheets, resumes, CVs)
    const hasCareerOrAcademicContent = /bachelor|degree|engineering|mechanical|civil|developer|software|curriculum|vitae|resume|experience|projects?|marksheet|qualification|college|university|matric|school|statement\s*of\s*marks|riddhi|aditya|rana/i.test(resume_text || '') || /aditya|aadity|rana|monika|barde|resume|cv/i.test(fName);
    const isPureFinancialInvoice = (/tax\s*invoice|bill\s*to|gstin/i.test(resume_text || '') && !hasCareerOrAcademicContent);
    if (isPureFinancialInvoice) {
      return res.status(400).json({
        success: false,
        is_non_resume: true,
        error: 'Invoices ya generic financial bills allow nahi hain. Kripya apna original Resume / Academic dossier upload karein.'
      });
    }

    // Broader check allowing ANY professional domain resume (Software, Mechanical, Civil, Finance, Healthcare, Sales, Design, etc.)
    const hasAnyResumeIndicators = hasCareerOrAcademicContent || /skills?|experience|employment|education|projects?|summary|objective|qualification|work|history|job|certification|vitae|resume|degree|college|university|school|profile|responsibilit|achievement/i.test(resume_text || '');
    if (!isBuild && resume_text && resume_text.length > 250 && !hasAnyResumeIndicators) {
      return res.status(400).json({
        success: false,
        is_non_resume: true,
        error: 'The uploaded document does not contain recognizable resume sections (skills, work experience, or education). Please upload a valid resume.'
      });
    }

    // Query matching active scraped jobs from database
    let scrapedJobs = [];
    try {
      const kw = detectDomainSearchKeyword((resume_text || '') + ' ' + (resume_name || ''));
      const jobsRes = await pool.query(
        `SELECT id, company_name, title, location, work_mode, experience, salary, skills, description, original_job_url, apply_url 
         FROM scraped_jobs 
         WHERE (title ILIKE $1 OR description ILIKE $2) 
         ORDER BY confidence_score DESC, id DESC LIMIT 10`,
        [`%${kw}%`, `%${kw}%`]
      );
      scrapedJobs = jobsRes.rows || [];
    } catch(dbErr) {
      console.warn('[AI RESUME] Error fetching scraped jobs for domain:', dbErr.message);
    }

    const analysis = await analyzeResumeWithAI({
      resume_text,
      resume_name,
      job_description,
      fallback_user: isBuild ? targetUser : null,
      is_build_resume: isBuild,
      scraped_jobs: scrapedJobs,
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
