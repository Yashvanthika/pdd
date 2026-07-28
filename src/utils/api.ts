const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';

const apiBaseUrl = configuredBaseUrl.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
}
