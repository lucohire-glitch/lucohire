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
