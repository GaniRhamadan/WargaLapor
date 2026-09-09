import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach Sanctum Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wargalapor_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling HTML responses (SPA rewrite fallback on Vercel) and 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    // If backend is unreachable and Vercel/SPA rewrites /api/* to index.html, reject so service falls back to Supabase
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!doctype html') ||
        response.data.trim().startsWith('<html') ||
        String(response.headers['content-type'] || '').includes('text/html'))
    ) {
      const err: any = new Error('API route returned HTML (backend server unreachable on this host).');
      err.isHtmlRewrite = true;
      err.response = { status: 404, data: { message: 'Backend unreachable' } };
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    // Only remove auth credentials on explicit 401 from backend, NOT on HTML rewrites or network errors
    if (error.response?.status === 401 && !error.isHtmlRewrite) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('wargalapor_token');
        localStorage.removeItem('wargalapor_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
