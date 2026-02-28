export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'active' | 'on_hold' | 'completed';
export type UserRole = 'admin' | 'project_manager' | 'member';
export type UserStatus = 'online' | 'away' | 'offline';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  color: string;
  startDate: string;
  dueDate: string;
  members: string[];
  progress: number;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  projectId: string;
  dueDate: string;
  labels: string[];
  attachments: TaskAttachment[];
  subtasks: Subtask[];
  blockedBy: string[]; // task IDs that block this task (optional v2)
  commentCount: number;
  order: number;
}

export interface Activity {
  id: string;
  type: 'created' | 'status_changed' | 'assigned' | 'commented' | 'time_logged' | 'file_attached';
  userId: string;
  taskId: string;
  description: string;
  timestamp: string;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: string;
  description: string;
  billable: boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerValue: string;
  action: string;
  actionValue: string;
  enabled: boolean;
  projectId: string;
}

export interface Note {
  id: string;
  content: string;
  taskId?: string;
  projectId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'light' | 'dark' | 'minimal';

export const STATUS_CONFIG: Record<TaskStatus, { label: string; colorClass: string }> = {
  todo: { label: 'To Do', colorClass: 'bg-status-todo' },
  in_progress: { label: 'In Progress', colorClass: 'bg-status-progress' },
  in_review: { label: 'In Review', colorClass: 'bg-status-review' },
  done: { label: 'Done', colorClass: 'bg-status-done' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; colorClass: string }> = {
  urgent: { label: 'Urgent', colorClass: 'bg-priority-urgent' },
  high: { label: 'High', colorClass: 'bg-priority-high' },
  medium: { label: 'Medium', colorClass: 'bg-priority-medium' },
  low: { label: 'Low', colorClass: 'bg-priority-low' },
};
