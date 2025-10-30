import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_KEY } from '@/lib/config';
import { clearClientSession, redirectToLogin } from '@/lib/auth/session';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

const baseURL =
  typeof window === 'undefined' ? API_BASE_URL.replace(/\/+$/, '') : '/';

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 30000,
});

// Attach Authorization from localStorage in the browser
api.interceptors.request.use((config) => {
  const url = String(config.url || '');
  // Do not attach Authorization for auth endpoints that commonly don't expect Bearer
  // (some backends 500 if Bearer is present for these reads)
  const skipAuth = /\/api\/auth\/(login|register|send-verification|verify-token|logout|me(?:\/activity)?)/.test(url);

  let token = accessTokenMemory;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim() !== '') {
        token = stored;
        accessTokenMemory = stored;
      }
    } catch {}
  }

  if (!skipAuth && token && token.trim() !== '') {
    config.headers = config.headers ?? {};
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }

  // Ensure JSON defaults
  config.headers = config.headers ?? {};
  if (!(config.headers as any)['Accept']) {
    (config.headers as any)['Accept'] = '*/*';
  }
  if (API_KEY && !(config.headers as any)['x-api-key'] && !/\/api\/auth\//.test(url)) {
    (config.headers as any)['x-api-key'] = API_KEY;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = (error.config?.url || '').toString();
    const isAuthEndpoint = /\/api\/auth\//.test(url);
    if ((status === 401 || status === 403) && !isAuthEndpoint) {
      try {
        clearClientSession();
        const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
        redirectToLogin(next);
      } catch {}
    }
    return Promise.reject(error);
  }
);

export type ApiError = AxiosError<{ error?: any; message?: string }>;

export function setTokens(accessToken?: string | null, refreshToken?: string | null) {
  accessTokenMemory = accessToken && accessToken.trim() !== '' ? accessToken : null;
  refreshTokenMemory = refreshToken && refreshToken.trim() !== '' ? refreshToken : null;

  if (accessTokenMemory) {
    api.defaults.headers.common['Authorization'] = `Bearer ${accessTokenMemory}`;
  } else {
    delete (api.defaults.headers.common as any)['Authorization'];
  }

  if (typeof window !== 'undefined') {
    if (accessTokenMemory) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessTokenMemory);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    if (refreshTokenMemory) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenMemory);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

export async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const res: AxiosResponse<T> = await api.get(path, config);
  return res.data;
}

export async function del<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const res: AxiosResponse<T> = await api.delete(path, config);
  return res.data;
}

export async function post<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const res: AxiosResponse<T> = await api.post(path, body, config);
  return res.data;
}

export async function put<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const res: AxiosResponse<T> = await api.put(path, body, config);
  return res.data;
}

export async function patch<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const res: AxiosResponse<T> = await api.patch(path, body, config);
  return res.data;
}

export default api;
