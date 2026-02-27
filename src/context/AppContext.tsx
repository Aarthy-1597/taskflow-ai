import { useState, createContext, useContext, ReactNode } from 'react';
import { Task, Project, TimeEntry, AutomationRule, Activity } from '@/data/types';
import { tasks as initialTasks, projects as initialProjects, timeEntries as initialTimeEntries, automationRules as initialRules, activities as initialActivities, teamMembers } from '@/data/mockData';

interface AppState {
  tasks: Task[];
  projects: Project[];
  timeEntries: TimeEntry[];
  automationRules: AutomationRule[];
  activities: Activity[];
  selectedProjectId: string | null;
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  setSelectedProjectId: (id: string | null) => void;
  getTeamMember: (id: string) => typeof teamMembers[0] | undefined;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects] = useState<Project[]>(initialProjects);
  const [timeEntries] = useState<TimeEntry[]>(initialTimeEntries);
  const [automationRules] = useState<AutomationRule[]>(initialRules);
  const [activities] = useState<Activity[]>(initialActivities);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('p1');

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const getTeamMember = (id: string) => teamMembers.find(m => m.id === id);

  return (
    <AppContext.Provider value={{
      tasks, projects, timeEntries, automationRules, activities,
      selectedProjectId, setTasks, updateTask, setSelectedProjectId, getTeamMember,
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
