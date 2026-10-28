const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  return (import.meta as any).env?.VITE_API_URL || 'https://lucohire.onrender.com/api';
};

export const API_URL: string = getApiUrl();

async function request<T = any>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach server. Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  if (data.token) {
    localStorage.setItem('luco_token', data.token);
    if (data.role) localStorage.setItem('luco_role', data.role);
    if (data.user) localStorage.setItem('luco_user', JSON.stringify(data.user));
  }
  return data;
}

export const sendOtp = async (target: string, type: 'email' | 'mobile' = 'email') => {
  const data = await request<{ success: boolean; otp: string; message: string }>('/auth/send-otp', { target, type });
  console.log(`%c[LucoHire OTP for ${target} (${type})]: ${data.otp}`, 'background: #22c55e; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 14px;');
  return data;
};

export const verifyOtp = (target: string, otp: string) => request<{ success: boolean; message: string }>('/auth/verify-otp', { target, otp });

export const candidateSignup = (payload: Record<string, any>) => request('/auth/candidate/signup', payload);
export const recruiterSignup = (payload: Record<string, any>) => request('/auth/recruiter/signup', payload);
export const login = (email: string, password: string) => request('/auth/login', { email, password });

export const logout = () => {
  localStorage.removeItem('luco_token');
  localStorage.removeItem('luco_role');
  localStorage.removeItem('luco_user');
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('luco_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getUserRole = () => localStorage.getItem('luco_role') || '';
export const isAuthenticated = () => !!localStorage.getItem('luco_token');

// ==========================================
// ADMIN API HELPERS
// ==========================================

export const getAdminToken = () => localStorage.getItem('luco_admin_token') || '';
export const isAdminAuthenticated = () => !!getAdminToken();

export const getAdminUser = () => {
  try {
    const raw = localStorage.getItem('luco_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const adminLogout = () => {
  localStorage.removeItem('luco_admin_token');
  localStorage.removeItem('luco_admin_user');
};

export async function adminApiRequest<T = any>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'DELETE' | 'PUT'; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const token = getAdminToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach server. Please check your backend connection.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Admin request failed.');
  }

  return data;
}

export const adminGetStatus = () =>
  adminApiRequest<{ hasAdmin: boolean; adminCount: number }>('/admin/status');

export const adminRegister = async (payload: { name: string; email: string; password: string }) => {
  const data = await adminApiRequest<{ token: string; role: string; user: any; message: string }>(
    '/admin/register',
    { method: 'POST', body: payload }
  );
  if (data.token) {
    localStorage.setItem('luco_admin_token', data.token);
    localStorage.setItem('luco_admin_user', JSON.stringify(data.user));
  }
  return data;
};

export const adminLogin = async (email: string, password: string) => {
  const data = await adminApiRequest<{ token: string; role: string; user: any; message: string }>(
    '/admin/login',
    { method: 'POST', body: { email, password } }
  );
  if (data.token) {
    localStorage.setItem('luco_admin_token', data.token);
    localStorage.setItem('luco_admin_user', JSON.stringify(data.user));
  }
  return data;
};

export const adminGetStats = () =>
  adminApiRequest<{ totalCandidates: number; totalRecruiters: number; totalUsers: number; totalAdmins: number }>(
    '/admin/stats'
  );

export const adminGetUsers = () =>
  adminApiRequest<{ count: number; users: any[] }>('/admin/users');

export const adminDeleteUser = (role: 'candidate' | 'recruiter', id: number | string) =>
  adminApiRequest<{ success: boolean; message: string; deletedId: number; role: string }>(
    `/admin/users/${role}/${id}`,
    { method: 'DELETE' }
  );

// ==========================================
// ADMIN & PUBLIC PLAN MANAGEMENT (CRUD)
// ==========================================

export interface PlanItem {
  id: number;
  name: string;
  category: 'freelancer' | 'recruiter' | string;
  price_amount: string;
  price_unit: string;
  description?: string;
  features?: string[];
  badge?: string;
  cta_text?: string;
  why_text?: string;
  is_popular?: boolean;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const adminGetPlans = (category?: string) =>
  adminApiRequest<{ success: boolean; stats: any; plans: PlanItem[] }>(
    `/admin/plans${category && category !== 'all' ? `?category=${category}` : ''}`
  );

export const adminCreatePlan = (payload: Partial<PlanItem>) =>
  adminApiRequest<{ success: boolean; message: string; plan: PlanItem }>(
    '/admin/plans',
    { method: 'POST', body: payload }
  );

export const adminUpdatePlan = (id: number, payload: Partial<PlanItem>) =>
  adminApiRequest<{ success: boolean; message: string; plan: PlanItem }>(
    `/admin/plans/${id}`,
    { method: 'PUT', body: payload }
  );

export const adminDeletePlan = (id: number) =>
  adminApiRequest<{ success: boolean; message: string; deletedId: number }>(
    `/admin/plans/${id}`,
    { method: 'DELETE' }
  );

export const getPublicPlans = async (category?: string): Promise<{ success: boolean; plans: PlanItem[] }> => {
  try {
    const res = await fetch(`${API_URL}/plans${category && category !== 'all' ? `?category=${category}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch public plans');
    return await res.json();
  } catch {
    return { success: false, plans: [] };
  }
};

// ==========================================
// CAREER PATHS MANAGEMENT (CHOOSE YOUR PATH CRUD)
// ==========================================

export interface CareerPathItem {
  id: number;
  path_key?: string;
  custom_id?: string;
  title: string;
  sub?: string;
  badge?: string;
  recommended?: boolean;
  syllabus?: string[];
  kya?: string;
  one_liner?: string;
  lessons?: number;
  jobs?: number;
  quick_wins?: Array<{ n: string; skill: string; time: string; jobs: string; line: string }>;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const getPublicCareerPaths = async (): Promise<{ success: boolean; paths: CareerPathItem[] }> => {
  try {
    const res = await fetch(`${API_URL}/paths`);
    if (!res.ok) throw new Error('Failed to fetch paths');
    return await res.json();
  } catch {
    return { success: false, paths: [] };
  }
};

export const adminGetCareerPaths = () =>
  adminApiRequest<{ success: boolean; count: number; paths: CareerPathItem[] }>('/admin/paths');

export const adminCreateCareerPath = (payload: Partial<CareerPathItem>) =>
  adminApiRequest<{ success: boolean; message: string; path: CareerPathItem }>('/admin/paths', {
    method: 'POST',
    body: payload,
  });

export const adminUpdateCareerPath = (id: number, payload: Partial<CareerPathItem>) =>
  adminApiRequest<{ success: boolean; message: string; path: CareerPathItem }>(`/admin/paths/${id}`, {
    method: 'PUT',
    body: payload,
  });

export const adminDeleteCareerPath = (id: number) =>
  adminApiRequest<{ success: boolean; message: string; deletedId: number }>(`/admin/paths/${id}`, {
    method: 'DELETE',
  });

// ==========================================
// RESUME SKILLS & JD KEYWORDS API
// ==========================================

export interface ResumeSkillItem {
  id: number;
  category: 'rising' | 'keyword' | 'outdated' | 'fading';
  skill_name: string;
  trend?: string;
  jobs?: string;
  salary?: string;
  learn_time?: string;
  note?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const getPublicResumeSkills = async (): Promise<{
  success: boolean;
  rising: ResumeSkillItem[];
  keywords: ResumeSkillItem[];
  all: ResumeSkillItem[];
}> => {
  try {
    const res = await fetch(`${API_URL}/skills`);
    if (!res.ok) throw new Error('Failed to fetch skills');
    return await res.json();
  } catch {
    return { success: false, rising: [], keywords: [], all: [] };
  }
};

export const adminGetResumeSkills = () =>
  adminApiRequest<{ success: boolean; count: number; skills: ResumeSkillItem[] }>('/admin/skills');

export const adminCreateResumeSkill = (payload: Partial<ResumeSkillItem>) =>
  adminApiRequest<{ success: boolean; message: string; skill: ResumeSkillItem }>('/admin/skills', {
    method: 'POST',
    body: payload,
  });

export const adminUpdateResumeSkill = (id: number, payload: Partial<ResumeSkillItem>) =>
  adminApiRequest<{ success: boolean; message: string; skill: ResumeSkillItem }>(`/admin/skills/${id}`, {
    method: 'PUT',
    body: payload,
  });

export const adminDeleteResumeSkill = (id: number) =>
  adminApiRequest<{ success: boolean; message: string; deletedId: number }>(`/admin/skills/${id}`, {
    method: 'DELETE',
  });

export const saveCandidatePathAndPlan = async (payload: {
  selected_path?: any;
  resume_data?: any;
  purchased_plan?: any;
}) => {
  const token = localStorage.getItem('luco_token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/candidate/path-and-plan`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return null;
  }
};

export const analyzeResumeAPI = async (payload: {
  resume_text?: string;
  resume_name?: string;
  job_description?: string;
}) => {
  const token = localStorage.getItem('luco_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/resume/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to analyze resume');
  return data;
};

// ==========================================
// UNIVERSAL JOB SCRAPING ENGINE (v2) APIs
// ==========================================

export interface ScrapedCompany {
  id: number;
  name: string;
  website: string;
  career_url: string;
  contact_email: string;
  ats_provider: string;
  access_status: 'ALLOWED' | 'ALLOWED_API_ONLY' | 'RESTRICTED' | 'BLOCKED_BY_OWNER' | 'UNDER_REVIEW';
  verification_status: 'Verified' | 'Needs review';
  country?: string;
  last_scanned_at?: string;
  structure_memory?: any;
  active_jobs_count?: number;
  latest_scan_status?: string;
  latest_scan_coverage?: string;
}

export interface ScrapedJob {
  id: number;
  company_id: number;
  company_name: string;
  company_website?: string;
  company_email?: string;
  title: string;
  location: string;
  work_mode: string;
  employment_type: string;
  department?: string;
  experience?: string;
  salary?: string;
  skills?: string[];
  description?: string;
  original_job_url: string;
  apply_url: string;
  ats_provider?: string;
  extraction_method?: string;
  confidence_score?: number;
  status: 'ACTIVE' | 'DISCOVERED' | 'SUSPECTED_REMOVED' | 'EXPIRED' | 'UNPUBLISHED';
  is_published: boolean;
  last_verified_at: string;
}

export interface ScraperScanRun {
  id: number;
  company_id: number;
  company_name: string;
  status: 'PASS' | 'PARTIAL' | 'INCOMPLETE' | 'MANUAL_REVIEW' | 'SOURCE_ERROR' | 'NO_OPENINGS' | 'ACCESS_RESTRICTED';
  coverage: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN';
  extraction_method: string;
  jobs_found: number;
  reported_job_count?: number;
  pages_visited: number;
  filters_explored: number;
  duration_seconds: number;
  failed_stage?: string;
  http_status_summary?: string;
  snapshot_data?: any;
  incomplete_sections?: string[];
  pending_tasks?: string[];
  outcome_notes?: string;
  retry_outcome?: string;
  created_at: string;
}

export interface ScrapedPublicJob {
  id: number;
  title: string;
  company: string;
  company_website?: string;
  company_email?: string;
  location: string;
  work_mode: string;
  employment_type: string;
  department?: string;
  salary?: string;
  apply_url: string;
  last_verified?: string;
  created_at?: string;
}

// 1. Candidate Public Jobs API (Live Jobs on LucoHire)
export const fetchPublicScrapedJobs = async (
  params: { search?: string; location?: string; work_mode?: string; limit?: number; offset?: number } = {}
) => {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.location) query.append('location', params.location);
  if (params.work_mode) query.append('work_mode', params.work_mode);
  if (params.limit) query.append('limit', String(params.limit));
  if (params.offset) query.append('offset', String(params.offset));

  const res = await fetch(`${API_URL}/scraper/public-jobs?${query.toString()}`);
  return (await res.json()) as { success: boolean; jobs: ScrapedPublicJob[]; count: number; totalCount?: number };
};

// 2. Admin Scraper APIs
const authHeaders = () => {
  const token = getAdminToken() || localStorage.getItem('luco_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const fetchScraperCompanies = async () => {
  const res = await fetch(`${API_URL}/scraper/companies`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch companies');
  return data;
};

export const addScraperCompany = async (payload: { name: string; website?: string; careerUrl?: string; contactEmail?: string }) => {
  const res = await fetch(`${API_URL}/scraper/companies`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to add company');
  return data;
};

export const importScraperCsv = async (companies: Array<{ name: string; website?: string; country?: string; contactEmail?: string }>) => {
  const res = await fetch(`${API_URL}/scraper/companies/import-csv`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ companies }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to import CSV');
  return data;
};

export const triggerCompanyScan = async (companyId: number, options: { keyword?: string; title?: string; location?: string } = {}) => {
  const res = await fetch(`${API_URL}/scraper/companies/${companyId}/scan`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to scan company');
  return data;
};

export const triggerScanAll = async () => {
  const res = await fetch(`${API_URL}/scraper/scan-all`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to run batch scans');
  return data;
};

export const fetchScraperScans = async (companyId?: number) => {
  const url = companyId ? `${API_URL}/scraper/scans?company_id=${companyId}` : `${API_URL}/scraper/scans`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch scans');
  return data;
};

export const fetchScraperScanDetails = async (scanId: number) => {
  const res = await fetch(`${API_URL}/scraper/scans/${scanId}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch scan details');
  return data;
};

export const retryScraperPending = async (scanId: number) => {
  const res = await fetch(`${API_URL}/scraper/scans/${scanId}/retry-pending`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to retry pending');
  return data;
};

export const fetchScraperJobs = async (params: { company_id?: number; company_name?: string; title?: string; location?: string; status?: string; search?: string } = {}) => {
  const query = new URLSearchParams();
  if (params.company_id) query.append('company_id', String(params.company_id));
  if (params.company_name) query.append('company_name', params.company_name);
  if (params.title) query.append('title', params.title);
  if (params.location) query.append('location', params.location);
  if (params.status) query.append('status', params.status);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_URL}/scraper/jobs?${query.toString()}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch jobs');
  return data;
};

export const toggleScraperJobPublish = async (jobId: number, is_published: boolean) => {
  const res = await fetch(`${API_URL}/scraper/jobs/${jobId}/publish`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ is_published }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to toggle job status');
  return data;
};



