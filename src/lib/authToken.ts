/**
 * Auth token storage for Bearer token authentication.
 * Used when cookies don't work cross-origin (e.g. frontend and backend on different domains).
 * Microsoft login redirect stores token in sessionStorage 'appToken'; we use that first so /api/auth/me works on live.
 */
const TOKEN_KEY = 'auth_token';
const APP_TOKEN_KEY = 'appToken';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(APP_TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY) ?? import.meta.env.VITE_AUTH_TOKEN ?? null;
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(APP_TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(APP_TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/** Build Authorization header value when token exists */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
