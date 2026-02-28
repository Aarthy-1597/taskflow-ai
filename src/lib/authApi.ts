/**
 * Auth API configuration.
 * Uses VITE_AUTH_API_URL if set; otherwise falls back to VITE_API_URL so one env var works for both API and auth.
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
