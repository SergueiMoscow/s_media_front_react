import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from '../utils/media';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const isUserLoggedIn = (): boolean => Boolean(getAccessToken());

/** Собрать читаемое сообщение об ошибке из тела ответа (как в старом приложении). */
export function errorMessageFromResponse(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Неизвестная ошибка';
  const obj = data as Record<string, unknown>;
  if (obj.error && typeof obj.error === 'object') {
    const err = obj.error as Record<string, unknown>;
    if (typeof err.error_message === 'string') return err.error_message;
  }
  const lines: string[] = [];
  for (const [field, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${field}: ${value.join(', ')}`);
    } else if (typeof value === 'string' || typeof value === 'number') {
      lines.push(`${field}: ${value}`);
    }
  }
  return lines.length > 0 ? lines.join('\n') : 'Неизвестная ошибка';
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Запросы токенов выполняются обычным axios (без перехватчиков).
const rawClient = axios.create();

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && config && !config._retry) {
      config._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await rawClient.post<{ access: string; refresh: string }>(
            `${BASE_URL}/api/token/refresh/`,
            { refresh: refreshToken },
          );
          const { access, refresh } = response.data;
          setTokens(access, refresh);
          config.headers.Authorization = `Bearer ${access}`;
          return apiClient.request(config);
        } catch {
          // Не удалось обновить токен — выходим.
        }
      }
      clearTokens();
      // Полная перезагрузка на страницу входа (гарантирует чистый стейт).
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
