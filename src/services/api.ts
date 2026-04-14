import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

// ─── Axios Instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10-second timeout (production needs more than 5s)
});

// ─── Client-Side Cache with TTL ────────────────────────────────────────────────
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 seconds

// Paths that should be cached (GET only)
const CACHEABLE_PREFIXES = ['/products', '/stores'];
const NON_CACHEABLE_PREFIXES = ['/cart', '/orders', '/auth', '/admin', '/vendor'];

function isCacheable(url: string | undefined): boolean {
  if (!url) return false;
  if (NON_CACHEABLE_PREFIXES.some(p => url.startsWith(p))) return false;
  return CACHEABLE_PREFIXES.some(p => url.startsWith(p));
}

function getCacheKey(config: InternalAxiosRequestConfig): string {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
}

export function invalidateClientCache(pattern?: string) {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// ─── Request Deduplication ─────────────────────────────────────────────────────
const pendingRequests = new Map<string, Promise<AxiosResponse>>();

// ─── Request Interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach JWT token
    const token = localStorage.getItem('prizzo_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor (retry with exponential backoff) ─────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && isCacheable(response.config.url)) {
      const key = getCacheKey(response.config);
      cache.set(key, { data: response, timestamp: Date.now() });
    }

    // Remove from pending requests
    if (response.config.method === 'get') {
      const key = getCacheKey(response.config);
      pendingRequests.delete(key);
    }

    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Remove from pending on error
    if (config?.method === 'get') {
      const key = getCacheKey(config);
      pendingRequests.delete(key);
    }

    // ── Retry logic: exponential backoff (300ms, 800ms) ──
    // Only retry on network errors and 5xx — NOT on 4xx (429, 401, 400, etc.)
    if (config && !config._retryCount) config._retryCount = 0;
    if (config && config._retryCount! < 2) {
      const isRetryable = error.code === 'ECONNABORTED' || 
                          error.code === 'ERR_NETWORK' ||
                          (error.response?.status !== undefined && error.response.status >= 500);
      
      if (isRetryable) {
        config._retryCount!++;
        const delay = config._retryCount === 1 ? 300 : 800;
        await new Promise(r => setTimeout(r, delay));
        return api(config);
      }
    }

    // ── Handle 401 globally ──
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        console.warn('[API 401] Unauthorized — clearing session.');
        localStorage.removeItem('prizzo_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Wrapped GET with Cache + Deduplication ────────────────────────────────────
const originalGet = api.get.bind(api);

api.get = ((url: string, config?: any) => {
  const fullConfig = { ...config, url, method: 'get' } as InternalAxiosRequestConfig;
  const key = getCacheKey(fullConfig);

  // Check client-side cache first
  if (isCacheable(url)) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Promise.resolve(cached.data);
    }
  }

  // Deduplicate: if same GET is already in-flight, return same promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = originalGet(url, config);
  if (isCacheable(url)) {
    pendingRequests.set(key, promise);
  }

  return promise;
}) as typeof api.get;

// ─── AbortController Helper ───────────────────────────────────────────────────
export function createCancelableRequest() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}

export default api;
