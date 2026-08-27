const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://urban-eye-1x92.onrender.com';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (import.meta.env.DEV) {
    return cleanPath;
  }
  return `${BASE_URL}${cleanPath}`;
}
