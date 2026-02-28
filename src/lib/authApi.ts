/**
 * Auth API configuration.
 * Uses relative URLs in dev (Vite proxies /api/auth to backend).
 * Set VITE_AUTH_API_URL for production or when backend is on different host.
 * Falls back to VITE_API_URL when both point to same backend.
 */
const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || '';

export const AUTH_ENDPOINTS = {
  login: `${AUTH_BASE}/api/auth/microsoft/login`,
  /** POST with { email, password } - returns { token } or { access_token } */
  emailLogin: `${AUTH_BASE}/api/auth/login`,
  callback: `${AUTH_BASE}/api/auth/microsoft/callback`,
  logout: `${AUTH_BASE}/api/auth/logout`,
  me: `${AUTH_BASE}/api/auth/me`,
} as const;
