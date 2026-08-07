import type { AppRole } from '@/contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'parkinlog_token';

export type ApiUser = {
  id: string;
  email?: string;
  username?: string;
  fullName?: string;
  role: AppRole;
};

export type ApiSession = {
  token: string;
  user: ApiUser;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Erro HTTP ${response.status}`);
  }

  return payload as T;
};

export const api = {
  get token() {
    return getToken();
  },
  setToken,
  async login(username: string, password: string) {
    const session = await request<ApiSession>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    setToken(session.token);
    return session;
  },
  async me() {
    return request<ApiSession>('/auth/me');
  },
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
