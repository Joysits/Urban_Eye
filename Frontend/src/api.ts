const LIVE_BACKEND_URL = 'https://urban-eye-1x92.onrender.com';

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${LIVE_BACKEND_URL}${cleanPath}`;
}
