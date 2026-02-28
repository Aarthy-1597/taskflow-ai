import { AUTH_ENDPOINTS } from '@/lib/authApi';
import { getAuthHeaders } from '@/lib/authToken';

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
  /** JWT or access token - stored for Bearer auth on subsequent requests */
  token?: string;
  access_token?: string;
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

/** POST /api/auth/login - Email/password login, returns token. Call when backend supports it. */
export async function loginWithEmail(email: string, password: string): Promise<{ token: string; user?: AuthUser } | null> {
  try {
    const res = await fetch(AUTH_ENDPOINTS.emailLogin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; access_token?: string; user?: AuthMeResponse };
    const token = data.token ?? data.access_token;
    if (!token) return null;
    const { setAuthToken } = await import('@/lib/authToken');
    setAuthToken(token);
    const user = data.user
      ? {
          id: data.user.userId,
          name: data.user.displayName || data.user.email?.split('@')[0] || 'User',
          email: data.user.email || email,
          role: data.user.role ? data.user.role.charAt(0).toUpperCase() + data.user.role.slice(1) : 'Member',
          avatar: data.user.profileImageUrl || data.user.photoUrl || data.user.avatar,
        }
      : undefined;
    return { token, user };
  } catch {
    return null;
  }
}

/** GET /api/auth/logout - Clear session on backend */
export async function logout(): Promise<void> {
  const { clearAuthToken } = await import('@/lib/authToken');
  try {
    const res = await fetch(AUTH_ENDPOINTS.logout, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok && res.status !== 404) {
      throw new Error('Logout failed');
    }
  } catch {
    // Network error or backend unavailable - still clear local state
  } finally {
    clearAuthToken();
  }
}

/** GET /api/auth/me - Fetch current user from backend */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const headers: Record<string, string> = {};
    let token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('appToken') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(AUTH_ENDPOINTS.me, {
      credentials: 'include',
      cache: 'no-store',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    const data = (await res.json()) as AuthMeResponse;
    if (!data.userId || !data.email) return null;
     token = data.token ?? data.access_token;
    if (token) {
      const { setAuthToken } = await import('@/lib/authToken');
      setAuthToken(token);
    }
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
