import { useState, createContext, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Task, Project, TimeEntry, AutomationRule, Activity, Note, ThemeMode } from '@/data/types';
import { tasks as initialTasks, projects as initialProjects, timeEntries as initialTimeEntries, automationRules as initialRules, activities as initialActivities, teamMembers, notes as initialNotes } from '@/data/mockData';
import * as timeEntriesApi from '@/api/timeEntries';
import * as authApi from '@/api/auth';
import { toast } from 'sonner';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  timeEntries: TimeEntry[];
  automationRules: AutomationRule[];
  activities: Activity[];
  notes: Note[];
  selectedProjectId: string | null;
  theme: ThemeMode;
  user: User | null;
  currentUserId: string;
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setSelectedProjectId: (id: string | null) => void;
  getTeamMember: (id: string) => typeof teamMembers[0] | undefined;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addTimeEntry: (entry: Omit<TimeEntry, 'id'> | TimeEntry) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  refreshTimeEntries: (params?: timeEntriesApi.ListTimeEntriesParams) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

function getStoredTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('flowboard-theme') as ThemeMode) || 'dark';
  }
  return 'dark';
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove('dark', 'minimal');
  if (theme === 'dark') root.classList.add('dark');
  if (theme === 'minimal') root.classList.add('minimal');
  localStorage.setItem('flowboard-theme', theme);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects] = useState<Project[]>(initialProjects);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [automationRules] = useState<AutomationRule[]>(initialRules);
  const [activities] = useState<Activity[]>(initialActivities);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('p1');
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const t = getStoredTheme();
    applyTheme(t);
    return t;
  });
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem('taskflow-user');
    return stored ? JSON.parse(stored) : null;
  });

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('taskflow-user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('taskflow-user');
    }
  };

  useEffect(() => {
    authApi.getCurrentUser()
      .then(apiUser => {
        if (apiUser) {
          setUser({
            id: apiUser.id,
            name: apiUser.name,
            email: apiUser.email,
            role: apiUser.role || 'Member',
            avatar: apiUser.avatar,
          });
        }
      })
      .catch(() => { /* No session - keep localStorage or null */ });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* Continue with local logout */
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const apiUser = await authApi.getCurrentUser();
    if (apiUser) {
      setUser({
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role || 'Member',
        avatar: apiUser.avatar,
      });
    }
  }, [setUser]);

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const getTeamMember = (id: string) => teamMembers.find(m => m.id === id);

  const addNote = (note: Note) => setNotes(prev => [note, ...prev]);
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };
  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const refreshTimeEntries = useCallback(async (params?: timeEntriesApi.ListTimeEntriesParams) => {
    try {
      const entries = await timeEntriesApi.listTimeEntries(params);
      setTimeEntries(entries);
    } catch {
      // Keep existing state on API failure (e.g. backend not running)
    }
  }, []);

  const addTimeEntry = (entry: Omit<TimeEntry, 'id'> | TimeEntry) => {
    const hasId = 'id' in entry && entry.id;
    if (hasId) {
      setTimeEntries(prev => [entry as TimeEntry, ...prev]);
      return;
    }
    const e = entry as Omit<TimeEntry, 'id'>;
    const task = tasks.find(t => t.id === e.taskId);
    timeEntriesApi.createTimeEntry({
      task_id: e.taskId,
      user_id: e.userId,
      project_id: task?.projectId ?? '',
      hours: e.hours,
      date: e.date,
      description: e.description,
      billable: e.billable,
    }).then(created => {
      setTimeEntries(prev => [created, ...prev]);
    }).catch(() => {
      toast.info('Saved locally (API unavailable)');
      const id = 'te' + Date.now();
      setTimeEntries(prev => [{ ...e, id }, ...prev]);
    });
  };

  const updateTimeEntry = (id: string, updates: Partial<TimeEntry>) => {
    const body: Record<string, unknown> = {};
    if (updates.taskId !== undefined) body.task_id = updates.taskId;
    if (updates.userId !== undefined) body.user_id = updates.userId;
    if (updates.hours !== undefined) body.hours = updates.hours;
    if (updates.date !== undefined) body.date = updates.date;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.billable !== undefined) body.billable = updates.billable;
    timeEntriesApi.updateTimeEntry(id, body).then(updated => {
      setTimeEntries(prev => prev.map(e => e.id === id ? updated : e));
    }).catch(() => {
      toast.info('Updated locally (API unavailable)');
      setTimeEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    });
  };

  const deleteTimeEntry = (id: string) => {
    timeEntriesApi.deleteTimeEntryApi(id).then(() => {
      setTimeEntries(prev => prev.filter(e => e.id !== id));
    }).catch(() => {
      setTimeEntries(prev => prev.filter(e => e.id !== id));
    });
  };

  const setTheme = (t: ThemeMode) => {
    applyTheme(t);
    setThemeState(t);
  };

  return (
    <AppContext.Provider value={{
      tasks, projects, timeEntries, automationRules, activities, notes,
      selectedProjectId, theme, user, currentUserId: user?.id ?? '1',
      setTasks, updateTask, setSelectedProjectId, getTeamMember,
      addNote, updateNote, deleteNote, addTimeEntry, updateTimeEntry, deleteTimeEntry, refreshTimeEntries,
      setTheme, setUser, logout, refreshUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
