import React from 'react';
import { Button } from '@/components/ui/button';
import { AUTH_ENDPOINTS } from '@/lib/authApi';

// Same base as /api/auth/me (e.g. https://hackathon-7-v2y5.onrender.com/api/auth/microsoft/login)
const MICROSOFT_LOGIN_URL = AUTH_ENDPOINTS.login;

interface MicrosoftLoginButtonProps {
  onClick?: () => void;
}

const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    if (onClick) onClick();
    // Redirect to backend Microsoft OAuth flow
    window.location.href = MICROSOFT_LOGIN_URL;
  };

  return (
    <Button
      variant="outline"
      className="w-full h-12 bg-white text-black hover:bg-gray-100 border-none flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
      onClick={handleClick}
    >
      <svg className="w-5 h-5" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
        <path fill="#f3f3f3" d="M0 0h23v23H0z" />
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
      <span className="font-semibold">Sign in with Microsoft</span>
    </Button>
  );
};

export default MicrosoftLoginButton;
