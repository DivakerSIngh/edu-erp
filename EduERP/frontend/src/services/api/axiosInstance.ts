import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { store } from '../../app/store';
import { resetAuth } from '../../features/auth/store/authSlice';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';

/**
 * Central Axios instance.
 *
 * Security design:
 *  - withCredentials: true  → HttpOnly cookies sent automatically (access_token, refresh_token)
 *  - Tokens are NEVER stored in localStorage or sessionStorage
 *  - CSRF token injected from non-HttpOnly cookie on mutating requests
 *  - 401 responses trigger a single refresh attempt; on failure, clears auth state
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,            // Send cookies on every request
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCookieValue(name: string): string | null {
  const match = document.cookie.match(`(?:^|; )${name}=([^;]*)`);
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Request Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase() ?? '';
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      // Double-submit CSRF cookie — readable by JS (not HttpOnly)
      const csrf = getCookieValue('csrf_token');
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Token Refresh ────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue(error: unknown) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const is401         = error.response?.status === 401;
    const isRefreshPath = original.url?.includes('/auth/refresh');
    // Never attempt a silent refresh for public auth endpoints — the 401 there
    // means bad credentials, not an expired session, and masking it with the
    // refresh error ("Refresh token missing.") confuses the user.
    const isPublicAuthPath = /\/auth\/(login|logout|otp)/.test(original.url ?? '');

    if (is401 && !original._retry && !isRefreshPath && !isPublicAuthPath) {
      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise<AxiosResponse>((resolve, reject) => {
          pendingQueue.push({
            resolve: () => resolve(apiClient(original)),
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        await apiClient.post('/auth/refresh');
        drainQueue(null);
        return apiClient(original);
      } catch (refreshError) {
        drainQueue(refreshError);
        // Refresh failed — session expired, force logout
        store.dispatch(resetAuth());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
