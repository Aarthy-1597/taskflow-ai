import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Task, Project, TimeEntry, AutomationRule, Activity, Note, ThemeMode } from '@/data/types';
import { tasks as initialTasks, projects as initialProjects, timeEntries as initialTimeEntries, automationRules as initialRules, activities as initialActivities, teamMembers, notes as initialNotes } from '@/data/mockData';

export interface User {
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
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setSelectedProjectId: (id: string | null) => void;
  getTeamMember: (id: string) => typeof teamMembers[0] | undefined;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setUser: (user: User | null) => void;
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
  const [timeEntries] = useState<TimeEntry[]>(initialTimeEntries);
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

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const getTeamMember = (id: string) => teamMembers.find(m => m.id === id);

  const addNote = (note: Note) => setNotes(prev => [note, ...prev]);
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };
  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const setTheme = (t: ThemeMode) => {
    applyTheme(t);
    setThemeState(t);
  };

  return (
    <AppContext.Provider value={{
      tasks, projects, timeEntries, automationRules, activities, notes,
      selectedProjectId, theme, user,
      setTasks, updateTask, setSelectedProjectId, getTeamMember,
      addNote, updateNote, deleteNote, setTheme, setUser
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
