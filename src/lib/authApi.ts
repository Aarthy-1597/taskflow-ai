/**
 * Auth API configuration.
 * Uses VITE_AUTH_API_URL if set; otherwise falls back to VITE_API_URL so one env var works for both API and auth.
 */
const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || '';

export const AUTH_ENDPOINTS = {
  login: `${AUTH_BASE}/api/auth/microsoft/login`,
  callback: `${AUTH_BASE}/api/auth/microsoft/callback`,
  logout: `${AUTH_BASE}/api/auth/logout`,
  me: `${AUTH_BASE}/api/auth/me`,
} as const;
