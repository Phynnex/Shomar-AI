const DEFAULT_API_BASE = 'https://shomar-production.up.railway.app/';

/**
 * Base URL for all backend API requests.
 * Override by setting NEXT_PUBLIC_API_BASE_URL in the environment.
 */
export const API_BASE_URL =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
    ? ensureTrailingSlash(process.env.NEXT_PUBLIC_API_BASE_URL)
    : DEFAULT_API_BASE;

const DEFAULT_API_KEY = 'sk_admin_0f9fa1d0afdffc4379b4865ea82ed333';

export const API_KEY =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_KEY
    ? process.env.NEXT_PUBLIC_API_KEY
    : DEFAULT_API_KEY;

function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`;
}
