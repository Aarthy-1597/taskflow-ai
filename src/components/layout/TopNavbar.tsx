import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Minimize2, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ThemeMode } from '@/data/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const themeIcons: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, minimal: Minimize2 };
const themeOrder: ThemeMode[] = ['dark', 'light', 'minimal'];

export function TopNavbar() {
  const { theme, setTheme, user, logout } = useApp();
  const navigate = useNavigate();

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate('/login');
  };

  const Icon = themeIcons[theme];

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks, projects..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
        />
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-display text-muted-foreground bg-muted rounded border border-border">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={`Theme: ${theme}`}
        >
          <Icon className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-2 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display font-bold text-primary shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              {user?.name ? (
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-foreground leading-tight">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{user.role || user.email || 'Member'}</span>
                </div>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 bg-[#0C0C12] border-white/10 text-white shadow-2xl backdrop-blur-xl">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : null}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold">{user?.name || 'Guest'}</span>
                  <span className="text-[10px] text-gray-500 font-normal">{user?.email || 'Not signed in'}</span>
                  {user?.role && <span className="text-[10px] text-gray-500 font-normal">{user.role}</span>}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-white flex items-center gap-2 py-2">
              <UserIcon className="h-4 w-4 text-primary" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-white flex items-center gap-2 py-2">
              <Settings className="h-4 w-4 text-primary" /> Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 flex items-center gap-2 py-2 font-medium"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
