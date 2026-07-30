import { supabase } from './supabase';

export { API_ENDPOINTS } from '../../src/mobile/endpoints';
export type { DonorProfile, DonorSearchResult, RegisterDonorInput } from '../../src/mobile/types';

const requestTimeoutMs = getRequestTimeoutMs(process.env.NEXT_PUBLIC_API_TIMEOUT_MS);

function getRequestTimeoutMs(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15000;
}

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

  try {
    const response = await fetch(`/api/backend${normalizedPath}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed.', response.status);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    if (error?.name === 'AbortError') {
      throw new ApiError(`The backend did not respond within ${Math.round(requestTimeoutMs / 1000)} seconds.`, 0);
    }

    throw new ApiError('Unable to reach the backend. Check that the API server is running.', 0);
  } finally {
    clearTimeout(timeoutId);
  }
}
