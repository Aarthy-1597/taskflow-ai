import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { getCurrentUser } from '@/api/auth';
import { setAuthToken } from '@/lib/authToken';
import { Loader2 } from 'lucide-react';

/**
 * Handles OAuth callback redirect from backend.
 * Backend redirects here after Microsoft auth - we fetch user and redirect to app.
 * Supports token in URL: ?token=xxx or ?access_token=xxx
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token') ?? searchParams.get('access_token');
    if (token) {
      setAuthToken(token);
      // Remove token from URL for security
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('access_token');
      window.history.replaceState({}, '', url.pathname + url.search);
    }

    getCurrentUser()
      .then(user => {
        if (user) {
          setUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'Member',
            avatar: user.avatar,
          });
          navigate('/dashboard', { replace: true });
        } else {
          setError('Could not get user info');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      })
      .catch(() => {
        setError('Authentication failed');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      });
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030014] text-white">
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
