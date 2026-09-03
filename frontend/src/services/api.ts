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

// Response interceptor for handling 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wargalapor_token');
      localStorage.removeItem('wargalapor_user');
    }
    return Promise.reject(error);
  }
);

export default api;
