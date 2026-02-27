/**
 * Auth API configuration.
 * Uses relative URLs in dev (Vite proxies /api/auth to backend).
 * Set VITE_AUTH_API_URL for production or when backend is on different host.
 */
const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || '';

export const AUTH_ENDPOINTS = {
  login: `${AUTH_BASE}/api/auth/microsoft/login`,
  callback: `${AUTH_BASE}/api/auth/microsoft/callback`,
  logout: `${AUTH_BASE}/api/auth/logout`,
  me: `${AUTH_BASE}/api/auth/me`,
} as const;
