const API_URL: string = (import.meta as any).env?.VITE_API_URL || 'https://lucohire.onrender.com/api';

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
