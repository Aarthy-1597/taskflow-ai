import { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Task, Project, TimeEntry, AutomationRule, Activity, Note, ThemeMode, TeamMember, TaskAttachment, Subtask } from '@/data/types';
import { tasks as initialTasks, projects as initialProjects, timeEntries as initialTimeEntries, automationRules as initialRules, activities as initialActivities, teamMembers as initialTeamMembers, notes as initialNotes } from '@/data/mockData';
import { deleteAttachmentBlob, getAttachmentBlob, putAttachmentBlob } from '@/lib/attachmentsDb';
import { apiCreateProject, apiCreateTask, apiDeleteProject, apiDeleteTask, apiUpdateProject, apiUpdateTask, fetchInitialBoardData, fetchCurrentUser } from '@/lib/api';
import * as timeEntriesApi from '@/api/timeEntries';
import { toast } from 'sonner';

export interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  teamMembers: TeamMember[];
  timeEntries: TimeEntry[];
  automationRules: AutomationRule[];
  activities: Activity[];
  notes: Note[];
  selectedProjectId: string | null;
  theme: ThemeMode;
  user: User | null;
  currentUserId: string;
  setTasks: (tasks: Task[]) => void;
  setProjects: (projects: Project[]) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  createProject: (project: Omit<Project, 'id' | 'progress'> & { progress?: number }) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createTask: (task: Omit<Task, 'id' | 'commentCount' | 'order'> & { commentCount?: number; order?: number }) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addTaskAttachment: (taskId: string, file: File) => Promise<void>;
  removeTaskAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  downloadTaskAttachment: (attachmentId: string) => Promise<Blob | undefined>;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  setTaskBlockedBy: (taskId: string, blockedBy: string[]) => void;
  setSelectedProjectId: (id: string | null) => void;
  getTeamMember: (id: string) => TeamMember | undefined;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addTimeEntry: (entry: Omit<TimeEntry, 'id'> | TimeEntry) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  refreshTimeEntries: (params?: timeEntriesApi.ListTimeEntriesParams) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEYS = {
  theme: 'flowboard-theme',
  user: 'taskflow-user',
  tasks: 'taskflow-tasks-v2',
  projects: 'taskflow-projects-v1',
  team: 'taskflow-team-v1',
  selectedProjectId: 'taskflow-selected-project',
} as const;

function getStoredTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode) || 'dark';
  }
  return 'dark';
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove('dark', 'minimal');
  if (theme === 'dark') root.classList.add('dark');
  if (theme === 'minimal') root.classList.add('minimal');
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function safeJsonParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function createId(prefix: string) {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  const rand = cryptoObj?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${rand}`;
}

function ensureTaskShape(t: any): Task {
  const assignees: string[] = Array.isArray(t?.assignees)
    ? t.assignees.filter((x: unknown) => typeof x === 'string')
    : typeof t?.assignee === 'string'
      ? [t.assignee]
      : [];

  const attachments: TaskAttachment[] = Array.isArray(t?.attachments)
    ? t.attachments
        .filter((a: any) => a && typeof a.id === 'string' && typeof a.name === 'string')
        .map((a: any) => ({
          id: a.id,
          name: a.name,
          type: typeof a.type === 'string' ? a.type : 'application/octet-stream',
          size: typeof a.size === 'number' ? a.size : 0,
          createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date().toISOString(),
        }))
    : [];

  const subtasks: Subtask[] = Array.isArray(t?.subtasks)
    ? t.subtasks
        .filter((s: any) => s && typeof s.id === 'string' && typeof s.title === 'string')
        .map((s: any) => ({ id: s.id, title: s.title, done: !!s.done }))
    : [];

  const blockedBy: string[] = Array.isArray(t?.blockedBy)
    ? t.blockedBy.filter((x: unknown) => typeof x === 'string')
    : [];

  return {
    id: String(t?.id ?? createId('task')),
    title: String(t?.title ?? ''),
    description: String(t?.description ?? ''),
    status: (t?.status ?? 'todo') as Task['status'],
    priority: (t?.priority ?? 'medium') as Task['priority'],
    assignees,
    projectId: String(t?.projectId ?? ''),
    dueDate: String(t?.dueDate ?? ''),
    labels: Array.isArray(t?.labels) ? t.labels.filter((x: unknown) => typeof x === 'string') : [],
    attachments,
    subtasks,
    blockedBy,
    commentCount: typeof t?.commentCount === 'number' ? t.commentCount : 0,
    order: typeof t?.order === 'number' ? t.order : 0,
  };
}

function ensureProjectShape(p: any): Project {
  return {
    id: String(p?.id ?? createId('project')),
    name: String(p?.name ?? ''),
    description: String(p?.description ?? ''),
    status: (p?.status ?? 'active') as Project['status'],
    color: String(p?.color ?? 'hsl(238, 76%, 62%)'),
    startDate: String(p?.startDate ?? new Date().toISOString().slice(0, 10)),
    dueDate: String(p?.dueDate ?? ''),
    members: Array.isArray(p?.members) ? p.members.filter((x: unknown) => typeof x === 'string') : [],
    progress: typeof p?.progress === 'number' ? p.progress : 0,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = safeJsonParse<any[]>(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.tasks) : null);
    const base = stored && Array.isArray(stored) ? stored.map(ensureTaskShape) : initialTasks.map(ensureTaskShape);
    return base;
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = safeJsonParse<any[]>(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.projects) : null);
    const base = stored && Array.isArray(stored) ? stored.map(ensureProjectShape) : initialProjects.map(ensureProjectShape);
    return base;
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const stored = safeJsonParse<TeamMember[]>(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.team) : null);
    return stored && Array.isArray(stored) ? stored : initialTeamMembers;
  });
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [automationRules] = useState<AutomationRule[]>(initialRules);
  const [activities] = useState<Activity[]>(initialActivities);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return 'p1';
    return localStorage.getItem(STORAGE_KEYS.selectedProjectId) ?? 'p1';
  });
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const t = getStoredTheme();
    applyTheme(t);
    return t;
  });
  const [user, setUserState] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    if (selectedProjectId) localStorage.setItem(STORAGE_KEYS.selectedProjectId, selectedProjectId);
    else localStorage.removeItem(STORAGE_KEYS.selectedProjectId);
  }, [selectedProjectId]);

  // Optional backend integration: if VITE_API_URL is set, hydrate from API
  useEffect(() => {
    const hasApi = typeof import.meta !== 'undefined' && !!import.meta.env.VITE_API_URL;
    if (!hasApi) return;
    (async () => {
      try {
        // 1) Hydrate board data
        const { projects: apiProjects, tasks: apiTasks, users } = await fetchInitialBoardData();
        setProjects(apiProjects.map(ensureProjectShape));
        setTasks(apiTasks.map(ensureTaskShape));
        setTeamMembers(users);
      } catch (err) {
        console.error('Failed to load data from API, falling back to local data', err);
      }

      try {
        // 2) Hydrate current user from backend /auth/me (if logged in via Microsoft)
        const me = await fetchCurrentUser();
        setUser({
          name: me.displayName,
          email: me.email,
          role: me.role,
        });
      } catch {
        // Ignore if not logged in; user stays null
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
      void apiUpdateTask(id, updates).then(remote => {
        setTasks(prev => prev.map(t => t.id === id ? ensureTaskShape(remote) : t));
      }).catch(err => {
        console.error('Failed to sync task update to API', err);
      });
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));

    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
      void apiDeleteTask(id).catch(err => {
        console.error('Failed to sync task delete to API', err);
      });
    }
  };

  const createTask: AppState['createTask'] = (task) => {
    const id = createId('task');
    const next: Task = {
      ...task,
      id,
      commentCount: task.commentCount ?? 0,
      order: task.order ?? 0,
    };
    setTasks(prev => [next, ...prev]);

    // Fire-and-forget sync to backend if configured
    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
      void apiCreateTask({
        ...next,
      }).then(remote => {
        setTasks(prev => prev.map(t => t.id === id ? ensureTaskShape(remote) : t));
      }).catch(err => {
        console.error('Failed to sync task to API', err);
      });
    }

    return id;
  };

  const addTaskAttachment: AppState['addTaskAttachment'] = async (taskId, file) => {
    const attachmentId = createId('att');
    await putAttachmentBlob(attachmentId, file);
    const meta: TaskAttachment = {
      id: attachmentId,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, attachments: [meta, ...t.attachments] } : t)));
  };

  const removeTaskAttachment: AppState['removeTaskAttachment'] = async (taskId, attachmentId) => {
    await deleteAttachmentBlob(attachmentId);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, attachments: t.attachments.filter(a => a.id !== attachmentId) } : t))
    );
  };

  const downloadTaskAttachment: AppState['downloadTaskAttachment'] = async (attachmentId) => {
    return getAttachmentBlob(attachmentId);
  };

  const addSubtask: AppState['addSubtask'] = (taskId, title) => {
    const st: Subtask = { id: createId('st'), title: title.trim(), done: false };
    if (!st.title) return;
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, st] } : t)));
  };

  const toggleSubtask: AppState['toggleSubtask'] = (taskId, subtaskId) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.map(s => (s.id === subtaskId ? { ...s, done: !s.done } : s)) }
          : t
      )
    );
  };

  const deleteSubtask: AppState['deleteSubtask'] = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) } : t)));
  };

  const setTaskBlockedBy: AppState['setTaskBlockedBy'] = (taskId, blockedBy) => {
    const clean = Array.from(new Set(blockedBy)).filter(id => id !== taskId);
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, blockedBy: clean } : t)));
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

  const createProject: AppState['createProject'] = (project) => {
    const id = createId('project');
    const next: Project = {
      ...project,
      id,
      progress: project.progress ?? 0,
    };
    setProjects(prev => [next, ...prev]);
    if (!selectedProjectId) setSelectedProjectId(id);

    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
      void apiCreateProject(next).then(remote => {
        setProjects(prev => prev.map(p => p.id === id ? ensureProjectShape(remote) : p));
      }).catch(err => {
        console.error('Failed to sync project to API', err);
      });
    }

    return id;
  };

  const updateProject: AppState['updateProject'] = (id, updates) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));

    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
      void apiUpdateProject(id, updates).then(remote => {
        setProjects(prev => prev.map(p => p.id === id ? ensureProjectShape(remote) : p));
      }).catch(err => {
        console.error('Failed to sync project update to API', err);
      });
    }
  };

  const deleteProject: AppState['deleteProject'] = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setSelectedProjectId(prev => (prev === id ? null : prev));

    if (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) {
      void apiDeleteProject(id).catch(err => {
        console.error('Failed to sync project delete to API', err);
      });
    }
  };

  return (
    <AppContext.Provider value={{
      tasks,
      projects,
      teamMembers,
      timeEntries,
      automationRules,
      activities,
      notes,
      selectedProjectId,
      theme,
      user,
      currentUserId: '1',
      setTasks,
      setProjects,
      setTeamMembers,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      deleteTask,
      addTaskAttachment,
      removeTaskAttachment,
      downloadTaskAttachment,
      addSubtask,
      toggleSubtask,
      deleteSubtask,
      setTaskBlockedBy,
      setSelectedProjectId,
      getTeamMember,
      addNote,
      updateNote,
      deleteNote,
      addTimeEntry,
      updateTimeEntry,
      deleteTimeEntry,
      refreshTimeEntries,
      setTheme,
      setUser,
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
