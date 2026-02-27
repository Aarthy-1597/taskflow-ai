import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Minimize2, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ThemeMode } from '@/data/types';
import { useEffect, useState, type ChangeEventHandler } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listNotificationsApi, markNotificationReadApi, type AppNotification } from '@/lib/api';
import { io as socketClient } from 'socket.io-client';

const themeIcons: Record<ThemeMode, typeof Sun> = { light: Sun, dark: Moon, minimal: Minimize2 };
const themeOrder: ThemeMode[] = ['dark', 'light', 'minimal'];

export function TopNavbar() {
  const { theme, setTheme, user, logout, setUser, currentUserId } = useApp();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user?.avatar);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let cancelled = false;
    void listNotificationsApi().then((items) => {
      if (!cancelled) setNotifications(items);
    }).catch(() => {
      // no-op
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hasApi = typeof import.meta !== 'undefined' && !!import.meta.env.VITE_API_URL;
    if (!hasApi) return;
    const socket = socketClient(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    socket.emit('join', currentUserId);
    socket.on('notification', (payload: unknown) => {
      const n = payload as Record<string, unknown>;
      const normalized: AppNotification = {
        id: String(n.id ?? n._id ?? ''),
        userId: String(n.userId ?? n.user_id ?? ''),
        type: String(n.type ?? ''),
        title: String(n.title ?? 'Notification'),
        message: String(n.message ?? ''),
        taskId: n.taskId ? String(n.taskId) : n.task_id ? String(n.task_id) : undefined,
        projectId: n.projectId ? String(n.projectId) : n.project_id ? String(n.project_id) : undefined,
        read: !!n.read,
        createdAt: String(n.createdAt ?? new Date().toISOString()),
      };
      setNotifications(prev => [normalized, ...prev]);
    });
    return () => {
      socket.off('notification');
      socket.disconnect();
    };
  }, [currentUserId]);

  const getInitials = (name: string | undefined) => {
    if (!name || typeof name !== 'string') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  const handleProfileSave = () => {
    if (!displayName.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setUser({
      name: displayName.trim(),
      email: email.trim(),
      role: user?.role || 'Member',
      avatar: avatarPreview,
    });
    toast.success('Profile updated');
    setProfileOpen(false);
  };

  const handleAvatarChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    toast.success('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordOpen(false);
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (!n.read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      void markNotificationReadApi(n.id).catch(() => {
        // no-op
      });
    }
    if (n.taskId) navigate('/board');
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 mt-2 bg-[#0C0C12] border-white/10 text-white shadow-2xl backdrop-blur-xl">
            <DropdownMenuLabel className="text-xs text-gray-400">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-xs text-gray-400">No notifications yet</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors ${n.read ? 'opacity-70' : ''}`}
                  >
                    <div className="text-xs font-semibold">{n.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{n.message}</div>
                  </button>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem
              onClick={() => {
                setDisplayName(user?.name || '');
                setEmail(user?.email || '');
                setAvatarPreview(user?.avatar);
                setProfileOpen(true);
              }}
              className="cursor-pointer focus:bg-white/5 focus:text-white flex items-center gap-2 py-2"
            >
              <UserIcon className="h-4 w-4 text-primary" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setPasswordOpen(true)}
              className="cursor-pointer focus:bg-white/5 focus:text-white flex items-center gap-2 py-2"
            >
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

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{getInitials(displayName)}</span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Profile Picture</label>
                <Input type="file" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
              <Button onClick={handleProfileSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Current Password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">New Password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Confirm Password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
              <Button onClick={handleChangePassword}>Update Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
