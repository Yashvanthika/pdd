import { Platform } from 'react-native';
import { supabase } from './supabase';

const defaultApiBaseUrl = 'https://bloodlink-api.welcos.in';
const configuredBaseUrl = cleanConfigValue(process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl);
const requestTimeoutMs = getRequestTimeoutMs(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);

function cleanConfigValue(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function shouldUseHttp(value: string) {
  return /^(localhost|127\.0\.0\.1|10\.0\.2\.2|0\.0\.0\.0)(?::|\/|$)/i.test(value)
    || /^192\.168\./.test(value)
    || /^10\./.test(value)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value);
}

function getRequestTimeoutMs(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

function normalizeApiBaseUrl(value: string) {
  let baseUrl = cleanConfigValue(value || defaultApiBaseUrl).replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `${shouldUseHttp(baseUrl) ? 'http' : 'https'}://${baseUrl}`;
  }

  if (/^https?:\/\/0\.0\.0\.0(?::|\/|$)/.test(baseUrl)) {
    return baseUrl.replace('0.0.0.0', Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  }

  return baseUrl;
}

export const apiBaseUrl = normalizeApiBaseUrl(configuredBaseUrl);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiPublicFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, init);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError('Sign in again to continue.', 401);
  }

  return request<T>(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError(`The backend at ${apiBaseUrl} did not respond within ${Math.round(requestTimeoutMs / 1000)} seconds. Try again or check the API container logs.`, 0);
    }

    throw new ApiError(`Unable to reach the backend at ${apiBaseUrl}. Check EXPO_PUBLIC_API_BASE_URL and make sure the API server is running.`, 0);
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed.', response.status);
  }

  return data as T;
}
