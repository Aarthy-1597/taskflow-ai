import { AUTH_ENDPOINTS } from '@/lib/authApi';

/** API response from GET /api/auth/me */
export interface AuthMeResponse {
  userId: string;
  email: string;
  role: string;
  displayName: string;
  microsoftId?: string;
  /** Profile image URL - from Microsoft Graph or backend */
  profileImageUrl?: string;
  photoUrl?: string;
  avatar?: string;
  picture?: string;
  [key: string]: unknown;
}

/** Normalized user for app state */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

/** GET /api/auth/microsoft/login - Redirect to Microsoft login */
export function redirectToMicrosoftLogin(): void {
  window.location.href = AUTH_ENDPOINTS.login;
}

/** GET /api/auth/logout - Clear session on backend */
export async function logout(): Promise<void> {
  try {
    const res = await fetch(AUTH_ENDPOINTS.logout, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow',
    });
    if (!res.ok && res.status !== 404) {
      throw new Error('Logout failed');
    }
  } catch {
    // Network error or backend unavailable - still clear local state
  } finally {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('appToken');
    }
  }
}

/** GET /api/auth/me - Fetch current user from backend */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const headers: Record<string, string> = {};
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('appToken') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(AUTH_ENDPOINTS.me, {
      credentials: 'include',
      cache: 'no-store', // Avoid 304 for fresh user data
      headers,
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    const data = (await res.json()) as AuthMeResponse;
    if (!data.userId || !data.email) return null;
    const avatar = data.profileImageUrl || data.photoUrl || data.avatar || data.picture;
    return {
      id: data.userId,
      name: data.displayName || data.email.split('@')[0],
      email: data.email,
      role: data.role ? data.role.charAt(0).toUpperCase() + data.role.slice(1) : 'Member',
      avatar: avatar || undefined,
    };
  } catch {
    return null;
  }
}
