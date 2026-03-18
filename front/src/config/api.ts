const DEFAULT_API_PORT = '3001';

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, '');

const resolveApiBaseUrl = (): string => {
  const configuredBaseUrl = trimTrailingSlashes(import.meta.env.VITE_API_BASE_URL || '');

  if (configuredBaseUrl) {
    return configuredBaseUrl.endsWith('/api') ? configuredBaseUrl : `${configuredBaseUrl}/api`;
  }

  const apiPort = String(import.meta.env.VITE_API_PORT || DEFAULT_API_PORT);

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname || 'localhost';

    return `${protocol}//${hostname}:${apiPort}/api`;
  }

  return `http://localhost:${apiPort}/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};