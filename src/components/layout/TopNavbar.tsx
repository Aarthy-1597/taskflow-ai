import { Search, Bell, Sun, Moon, Minimize2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ThemeMode } from '@/data/types';

const themeIcons: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, minimal: Minimize2 };
const themeOrder: ThemeMode[] = ['dark', 'light', 'minimal'];

export function TopNavbar() {
  const { theme, setTheme } = useApp();

  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme);
    setTheme(themeOrder[(idx + 1) % themeOrder.length]);
  };

  const Icon = themeIcons[theme];

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
        <div className="ml-2 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-display font-bold text-primary">
          AC
        </div>
      </div>
    </header>
  );
}
