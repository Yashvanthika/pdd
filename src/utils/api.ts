import { requireSupabase } from '../lib/supabase';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';

const apiBaseUrl = configuredBaseUrl.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}

export async function authorizedJsonHeaders(): Promise<HeadersInit> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;

  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Your session expired. Sign in again to continue.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
