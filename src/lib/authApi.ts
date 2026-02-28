/**
 * Auth API configuration.
 * Uses VITE_AUTH_API_URL if set; otherwise falls back to VITE_API_URL so one env var works for both API and auth.
 * Falls back to VITE_API_URL when both point to same backend.
 */
const RAW_AUTH_BASE = import.meta.env.VITE_AUTH_API_URL || import.meta.env.VITE_API_URL || '';
const IS_LOCAL_AUTH_BASE = /localhost|127\.0\.0\.1/.test(RAW_AUTH_BASE);
const IS_LOCAL_HOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
// Safety fallback for misconfigured production builds (e.g. auth base accidentally points to localhost).
const AUTH_BASE = !IS_LOCAL_HOST && IS_LOCAL_AUTH_BASE
  ? 'https://hackathon-7-v2y5.onrender.com'
  : RAW_AUTH_BASE;

export const AUTH_ENDPOINTS = {
  login: `${AUTH_BASE}/api/auth/microsoft/login`,
  /** POST with { email, password } - returns { token } or { access_token } */
  emailLogin: `${AUTH_BASE}/api/auth/login`,
  callback: `${AUTH_BASE}/api/auth/microsoft/callback`,
  logout: `${AUTH_BASE}/api/auth/logout`,
  /** GET - exchange valid auth cookie for JWT token */
  token: `${AUTH_BASE}/api/auth/token`,
  me: `${AUTH_BASE}/api/auth/me`,
} as const;
