# Microsoft Auth Integration

The app integrates with the auth API at `http://localhost:3000` for Microsoft login, logout, and user info.

## API Endpoints (Integrated)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `http://localhost:3000/api/auth/microsoft/login` | GET | Redirects to Microsoft OAuth |
| `http://localhost:3000/api/auth/microsoft/callback` | GET | OAuth callback (handled by backend) |
| `http://localhost:3000/api/auth/logout` | POST | Clears session |
| `http://localhost:3000/api/auth/me` | GET | Returns current user info |

## Backend Configuration

1. **Proxy**: In dev, Vite proxies `/api/auth/*` to `http://localhost:3000`. Ensure your auth backend runs on port 3000.

2. **Profile image**: To show the user's profile photo, include one of these fields in the `/api/auth/me` response:
   - `profileImageUrl` – recommended
   - `photoUrl`, `avatar`, or `picture`
   
   Example (Microsoft Graph photo): Add `profileImageUrl` with a URL from Microsoft Graph or a proxied endpoint on your backend.

3. **OAuth Redirect URI**: Configure your Microsoft Azure app registration:
   - Redirect URI: `http://localhost:8080/api/auth/microsoft/callback` (dev)
   - This ensures the OAuth callback hits our app; the proxy forwards to your backend.

4. **Post-login redirect**: Your backend should redirect to `http://localhost:8080/auth/callback` after successful Microsoft auth. The frontend fetches `/api/auth/me` on that page to load the user.

5. **CORS / Cookies**: If not using the proxy, set `VITE_AUTH_API_URL=http://localhost:3000` and ensure your backend sends:
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Origin: http://localhost:8080` (your frontend origin)

## Integration Summary

| API | Usage |
|-----|-------|
| **Login** | `redirectToMicrosoftLogin()` → LoginPage Microsoft button |
| **User info** | `getCurrentUser()` → AppContext on mount, AuthCallbackPage after OAuth |
| **Logout** | `logout()` → TopNavbar, AppSidebar Sign Out |
| **Refresh** | `refreshUser()` → Call to re-fetch from `/api/auth/me` |

## Flow

1. User clicks "Sign in with Microsoft" → redirects to `/api/auth/microsoft/login` (proxied to 3000)
2. Backend redirects to Microsoft → user authenticates
3. Microsoft redirects to `/api/auth/microsoft/callback` (on backend)
4. Backend sets session cookie, redirects to `http://localhost:8080/auth/callback`
5. Frontend fetches `/api/auth/me`, sets user, navigates to dashboard
6. Logout: calls `POST /api/auth/logout`, clears local state
