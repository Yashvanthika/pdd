import { Platform } from 'react-native';
import { supabase } from './supabase';

const defaultApiBaseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl).trim();

function normalizeApiBaseUrl(value: string) {
  const baseUrl = (value || defaultApiBaseUrl).trim().replace(/\/+$/, '');
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
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${normalizedPath}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new ApiError(`Unable to reach the backend at ${apiBaseUrl}. Check EXPO_PUBLIC_API_BASE_URL and make sure the API server is running.`, 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'Request failed.', response.status);
  }

  return data as T;
}
