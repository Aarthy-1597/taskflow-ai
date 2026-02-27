import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
