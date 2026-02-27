import { Task, Project, TimeEntry, AutomationRule, Activity, TeamMember } from './types';

export const teamMembers: TeamMember[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@flowboard.io', avatar: '', role: 'admin', status: 'online' },
  { id: '2', name: 'Sarah Kim', email: 'sarah@flowboard.io', avatar: '', role: 'project_manager', status: 'online' },
  { id: '3', name: 'Marcus Johnson', email: 'marcus@flowboard.io', avatar: '', role: 'member', status: 'away' },
  { id: '4', name: 'Elena Vasquez', email: 'elena@flowboard.io', avatar: '', role: 'member', status: 'offline' },
  { id: '5', name: 'Raj Patel', email: 'raj@flowboard.io', avatar: '', role: 'member', status: 'online' },
];

export const projects: Project[] = [
  { id: 'p1', name: 'FlowBoard Platform', description: 'Main SaaS product development', status: 'active', color: 'hsl(238, 76%, 62%)', startDate: '2026-01-15', dueDate: '2026-04-30', members: ['1', '2', '3'], progress: 65 },
  { id: 'p2', name: 'Mobile App v2', description: 'React Native mobile redesign', status: 'active', color: 'hsl(142, 71%, 45%)', startDate: '2026-02-01', dueDate: '2026-05-15', members: ['2', '4', '5'], progress: 30 },
  { id: 'p3', name: 'API Gateway', description: 'Microservices API layer', status: 'on_hold', color: 'hsl(38, 92%, 50%)', startDate: '2026-01-01', dueDate: '2026-03-31', members: ['1', '3'], progress: 80 },
  { id: 'p4', name: 'Design System', description: 'Component library & tokens', status: 'active', color: 'hsl(280, 60%, 55%)', startDate: '2026-02-10', dueDate: '2026-03-20', members: ['4', '5'], progress: 45 },
];

export const tasks: Task[] = [
  { id: 't1', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated deployments', status: 'done', priority: 'high', assignee: '1', projectId: 'p1', dueDate: '2026-02-20', labels: ['DevOps'], commentCount: 3, attachmentCount: 1, order: 0 },
  { id: 't2', title: 'Design dashboard wireframes', description: 'Create high-fidelity wireframes for the main dashboard', status: 'in_review', priority: 'medium', assignee: '4', projectId: 'p1', dueDate: '2026-02-28', labels: ['Design'], commentCount: 5, attachmentCount: 3, order: 0 },
  { id: 't3', title: 'Implement auth flow', description: 'Microsoft SSO integration with Azure AD', status: 'in_progress', priority: 'urgent', assignee: '1', projectId: 'p1', dueDate: '2026-02-25', labels: ['Feature', 'Security'], commentCount: 8, attachmentCount: 0, order: 0 },
  { id: 't4', title: 'Build Kanban component', description: 'Drag-and-drop Kanban board with @dnd-kit', status: 'in_progress', priority: 'high', assignee: '3', projectId: 'p1', dueDate: '2026-03-01', labels: ['Feature'], commentCount: 2, attachmentCount: 0, order: 1 },
  { id: 't5', title: 'API rate limiting', description: 'Implement rate limiting middleware', status: 'todo', priority: 'medium', assignee: '5', projectId: 'p3', dueDate: '2026-03-10', labels: ['Backend'], commentCount: 1, attachmentCount: 0, order: 0 },
  { id: 't6', title: 'User onboarding flow', description: 'Create step-by-step onboarding for new users', status: 'todo', priority: 'high', assignee: '2', projectId: 'p1', dueDate: '2026-03-05', labels: ['Feature', 'UX'], commentCount: 0, attachmentCount: 0, order: 1 },
  { id: 't7', title: 'Fix mobile nav bug', description: 'Navigation menu not closing on mobile', status: 'todo', priority: 'urgent', assignee: '3', projectId: 'p2', dueDate: '2026-02-26', labels: ['Bug'], commentCount: 4, attachmentCount: 1, order: 2 },
  { id: 't8', title: 'Write API documentation', description: 'OpenAPI spec for all endpoints', status: 'in_review', priority: 'low', assignee: '5', projectId: 'p3', dueDate: '2026-03-15', labels: ['Docs'], commentCount: 2, attachmentCount: 2, order: 1 },
  { id: 't9', title: 'Button component variants', description: 'Add all button variants to design system', status: 'in_progress', priority: 'medium', assignee: '4', projectId: 'p4', dueDate: '2026-03-01', labels: ['Design'], commentCount: 1, attachmentCount: 0, order: 2 },
  { id: 't10', title: 'Performance audit', description: 'Lighthouse audit and optimization', status: 'todo', priority: 'low', assignee: '1', projectId: 'p1', dueDate: '2026-03-20', labels: ['DevOps'], commentCount: 0, attachmentCount: 0, order: 3 },
];

export const activities: Activity[] = [
  { id: 'a1', type: 'status_changed', userId: '3', taskId: 't4', description: 'moved task to In Progress', timestamp: '2026-02-27T09:30:00Z' },
  { id: 'a2', type: 'commented', userId: '2', taskId: 't3', description: 'commented on auth flow', timestamp: '2026-02-27T09:15:00Z' },
  { id: 'a3', type: 'assigned', userId: '1', taskId: 't6', description: 'assigned to Sarah Kim', timestamp: '2026-02-27T08:45:00Z' },
  { id: 'a4', type: 'created', userId: '2', taskId: 't7', description: 'created new bug report', timestamp: '2026-02-27T08:30:00Z' },
  { id: 'a5', type: 'status_changed', userId: '1', taskId: 't1', description: 'moved task to Done', timestamp: '2026-02-26T17:00:00Z' },
  { id: 'a6', type: 'time_logged', userId: '4', taskId: 't2', description: 'logged 2.5 hours', timestamp: '2026-02-26T16:30:00Z' },
  { id: 'a7', type: 'file_attached', userId: '4', taskId: 't2', description: 'attached wireframe-v3.fig', timestamp: '2026-02-26T15:00:00Z' },
];

export const timeEntries: TimeEntry[] = [
  { id: 'te1', taskId: 't3', userId: '1', hours: 3.5, date: '2026-02-27', description: 'Azure AD integration research', billable: true },
  { id: 'te2', taskId: 't2', userId: '4', hours: 2.5, date: '2026-02-26', description: 'Dashboard wireframes v3', billable: true },
  { id: 'te3', taskId: 't4', userId: '3', hours: 4, date: '2026-02-27', description: 'Kanban drag-drop implementation', billable: true },
  { id: 'te4', taskId: 't1', userId: '1', hours: 1.5, date: '2026-02-26', description: 'CI/CD debugging', billable: false },
  { id: 'te5', taskId: 't9', userId: '4', hours: 2, date: '2026-02-27', description: 'Button variants design', billable: true },
];

export const automationRules: AutomationRule[] = [
  { id: 'ar1', name: 'Notify PM on review', trigger: 'status_changed', triggerValue: 'in_review', action: 'send_notification', actionValue: 'PM notified', enabled: true, projectId: 'p1' },
  { id: 'ar2', name: 'Urgent on overdue', trigger: 'task_overdue', triggerValue: '', action: 'change_priority', actionValue: 'urgent', enabled: true, projectId: 'p1' },
  { id: 'ar3', name: 'Celebrate completion', trigger: 'status_changed', triggerValue: 'done', action: 'send_teams_message', actionValue: '🎉 Task completed!', enabled: false, projectId: 'p1' },
];
