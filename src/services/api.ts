import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15-second timeout to prevent hanging requests
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Attaches the JWT token from localStorage on every outgoing request.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('prizzo_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error.message);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ──────────────────────────────────────────────────────
// Handles 401 (unauthorized) globally — clears stale tokens and redirects to login.
// All other errors are passed through so individual callers can handle them.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Token expired or invalid — clear auth state and redirect to login
        console.warn('[API 401] Unauthorized — clearing session.');
        localStorage.removeItem('prizzo_token');

        // Only redirect if not already on the login page (avoids redirect loops)
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        console.warn('[API 403] Forbidden — insufficient permissions.');
      }

      if (status >= 500) {
        console.error('[API 5xx] Server error:', (error.response.data as any)?.message || error.message);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('[API Timeout] Request timed out.');
    } else if (!error.response) {
      console.error('[API Network Error] Unable to reach server. Is the backend running?');
    }

    return Promise.reject(error);
  }
);

export default api;
