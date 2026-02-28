import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import BoardPage from "./pages/board/BoardPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import NotesPage from "./pages/notes/NotesPage";
import TimePage from "./pages/time/TimePage";
import AutomationPage from "./pages/automation/AutomationPage";
import TeamPage from "./pages/team/TeamPage";
import SettingsPage from "./pages/settings/SettingsPage";
import LoginPage from "./pages/auth/LoginPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import AdminPage from "./pages/roles/AdminPage";
import ProjectManagerPage from "./pages/roles/ProjectManagerPage";
import TeamMemberPage from "./pages/roles/TeamMemberPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AUTH_TOKEN_KEY = "appToken";

/** Read token from post-login redirect hash (#token=...) and store for API Authorization header (fixes 401 when cross-origin cookies are blocked, e.g. Render + Netlify). */
export function getStoredAuthToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

const App = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#token=")) {
      try {
        const token = decodeURIComponent(hash.slice(7).trim());
        if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch (_) {}
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      // Always hard-redirect once token is saved so AppContext boots with token present.
      // This avoids race conditions where /api/auth/me runs before token is written.
      window.location.replace(window.location.origin + "/dashboard");
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/time" element={<TimePage />} />
              <Route path="/automation" element={<AutomationPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/manager" element={<ProjectManagerPage />} />
              <Route path="/member" element={<TeamMemberPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
