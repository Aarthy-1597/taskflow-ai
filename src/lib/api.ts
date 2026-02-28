import type { Activity, AutomationRule, Note, Project, Task, TeamMember } from "@/data/types";

const API_URL = import.meta.env.VITE_API_URL;
const AUTH_TOKEN_KEY = "appToken";

function toProjectModel(p: any): Project {
  return {
    id: String(p?._id ?? p?.id ?? ""),
    name: String(p?.name ?? ""),
    description: String(p?.description ?? ""),
    status: (String(p?.status ?? "active").toLowerCase().replace(" ", "_") as Project["status"]),
    color: String(p?.color ?? "#4F46E5"),
    startDate:
      (p?.start_date ?? p?.startDate ?? new Date()).toISOString?.().slice(0, 10) ??
      String(p?.start_date ?? p?.startDate ?? ""),
    dueDate:
      (p?.end_date ?? p?.dueDate ?? "").toISOString?.().slice(0, 10) ??
      String(p?.end_date ?? p?.dueDate ?? ""),
    members: Array.isArray(p?.team_members)
      ? p.team_members.map((m: any) => String(m?._id ?? m?.id ?? m))
      : Array.isArray(p?.members)
      ? p.members.map((id: any) => String(id))
      : [],
    progress: typeof p?.task_count === "number" ? p.task_count : typeof p?.progress === "number" ? p.progress : 0,
  };
}


function toTaskModel(t: any, fallbackProjectId?: string): Task {
  const rawStatus = String(t?.status ?? "todo").toLowerCase().replace(/[\s-]+/g, "_");
  const status: Task["status"] =
    rawStatus === "to_do" || rawStatus === "todo"
      ? "todo"
      : rawStatus === "in_progress"
      ? "in_progress"
      : rawStatus === "in_review"
      ? "in_review"
      : rawStatus === "done"
      ? "done"
      : "todo";

  return {
    id: String(t?._id ?? t?.id ?? ""),
    title: String(t?.title ?? ""),
    description: String(t?.description ?? ""),
    status,
    priority: (String(t?.priority ?? "medium").toLowerCase() as Task["priority"]),
    assignees: Array.isArray(t?.assignees)
      ? t.assignees.map((a: any) => String(a?._id ?? a?.id ?? a))
      : [],
    projectId: String(t?.project_id ?? t?.projectId ?? fallbackProjectId ?? ""),
    dueDate:
      (t?.due_date ?? t?.dueDate ?? "").toISOString?.().slice(0, 10) ??
      String(t?.due_date ?? t?.dueDate ?? ""),
    labels: Array.isArray(t?.labels) ? t.labels.map((x: any) => String(x)) : [],
    attachments: [],
    subtasks: [],
    blockedBy: Array.isArray(t?.blocked_by)
      ? t.blocked_by.map((b: any) => String(b?._id ?? b?.id ?? b))
      : Array.isArray(t?.blockedBy)
      ? t.blockedBy.map((id: any) => String(id))
      : [],
    commentCount: typeof t?.commentCount === "number" ? t.commentCount : 0,
    order: typeof t?.order === "number" ? t.order : 0,
  };
}

function toApiTaskStatus(status?: Task["status"]): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "in_review":
      return "In Review";
    case "done":
      return "Done";
    default:
      return "To Do";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers,
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

// Generic helpers used by timeEntries API and others
export async function apiGet<T>(path: string, query?: Record<string, string>): Promise<T> {
  const url = query
    ? `${path}?${new URLSearchParams(query).toString()}`
    : path;
  return request<T>(url);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete(path: string): Promise<void> {
  await request<void>(path, { method: "DELETE" });
}

/** GET /api/projects — list all projects (for Projects page) */
export async function listProjectsApi(): Promise<Project[]> {
  const raw = await request<any>("/api/projects");
  const arr = Array.isArray(raw) ? raw : raw?.projects ?? [];
  return arr.map(toProjectModel);
}

export async function fetchInitialBoardData() {
  const [projectsRaw, tasksRaw, usersRaw] = await Promise.all([
    request<any>("/api/projects"),
    request<any>("/api/tasks"),
    request<any>("/api/users"),
  ]);

  const projects = (Array.isArray(projectsRaw) ? projectsRaw : projectsRaw?.projects ?? []).map(toProjectModel);

  const tasks = (Array.isArray(tasksRaw) ? tasksRaw : tasksRaw.tasks ?? []).map((t: any) =>
    toTaskModel(t)
  );

  const users = (Array.isArray(usersRaw) ? usersRaw : usersRaw.users ?? []).map(
    (u: any): TeamMember => ({
      id: String(u._id ?? u.id ?? ""),
      name: String(u.name ?? ""),
      email: String(u.email ?? ""),
      avatar: String(u.avatarUrl ?? u.avatar ?? ""),
      role: (u.role === "manager"
        ? "project_manager"
        : u.role === "member"
        ? "member"
        : "admin") as TeamMember["role"],
      status: (u.status === "disabled" ? "offline" : "online") as TeamMember["status"],
    })
  );

  return { projects, tasks, users };
}

export async function apiCreateProject(body: Partial<Project>): Promise<Project> {
  const apiBody: Record<string, unknown> = {
    name: body.name,
    description: body.description,
    status: body.status
      ? String(body.status).replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Active",
    color: body.color,
    start_date: body.startDate || undefined,
    end_date: body.dueDate || undefined,
    team_members: body.members ?? [],
  };
  const res = await request<{ project?: any } | any>("/api/projects", {
    method: "POST",
    body: JSON.stringify(apiBody),
  });
  return toProjectModel(res.project ?? res);
}

export async function apiUpdateProject(id: string, body: Partial<Project>): Promise<Project> {
  const apiBody: Record<string, unknown> = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.status !== undefined
      ? { status: String(body.status).replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) }
      : {}),
    ...(body.color !== undefined ? { color: body.color } : {}),
    ...(body.startDate !== undefined ? { start_date: body.startDate } : {}),
    ...(body.dueDate !== undefined ? { end_date: body.dueDate } : {}),
    ...(body.members !== undefined ? { team_members: body.members } : {}),
  };
  const res = await request<{ project?: any } | any>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(apiBody),
  });
  return toProjectModel(res.project ?? res);
}

export async function apiDeleteProject(id: string): Promise<void> {
  await request<void>(`/api/projects/${id}`, { method: "DELETE" });
}

export async function apiCreateTask(body: Partial<Task>): Promise<Task> {
  if (!body.projectId) {
    throw new Error("projectId is required to create a task");
  }

  const apiBody: Record<string, unknown> = {
    title: body.title,
    description: body.description,
    status: toApiTaskStatus(body.status as Task["status"] | undefined),
    priority: body.priority
      ? String(body.priority).charAt(0).toUpperCase() + String(body.priority).slice(1)
      : "Medium",
    assignees: body.assignees ?? [],
    due_date: body.dueDate || undefined,
    labels: body.labels ?? [],
    blocked_by: body.blockedBy ?? [],
    order: body.order ?? 0,
  };

  const res = await request<{ task: any }>("/api/tasks/project/" + body.projectId, {
    method: "POST",
    body: JSON.stringify(apiBody),
  });

  const t = res.task ?? res;

  return toTaskModel(t, body.projectId);
}

export async function apiUpdateTask(id: string, body: Partial<Task>): Promise<Task> {
  const apiBody: Record<string, unknown> = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.status !== undefined
      ? { status: toApiTaskStatus(body.status as Task["status"]) }
      : {}),
    ...(body.priority !== undefined
      ? { priority: String(body.priority).charAt(0).toUpperCase() + String(body.priority).slice(1) }
      : {}),
    ...(body.assignees !== undefined ? { assignees: body.assignees } : {}),
    ...(body.dueDate !== undefined ? { due_date: body.dueDate } : {}),
    ...(body.labels !== undefined ? { labels: body.labels } : {}),
    ...(body.blockedBy !== undefined ? { blocked_by: body.blockedBy } : {}),
    ...(body.order !== undefined ? { order: body.order } : {}),
  };
  const res = await request<{ task?: any } | any>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(apiBody),
  });
  return toTaskModel(res.task ?? res, body.projectId);
}

export async function apiDeleteTask(id: string): Promise<void> {
  await request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

// Auth / user helpers (path is /api/auth/me; send stored token so /me works when cross-origin cookies are blocked)
export async function fetchCurrentUser() {
  const headers: Record<string, string> = {};
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }
  return res.json() as Promise<{
    userId: string;
    email: string;
    role: string;
    microsoftId?: string;
    displayName: string;
    avatarUrl?: string;
  }>;
}

/** PATCH /api/auth/me - Update current user profile (name, email only; use updateProfileAvatarApi for image) */
export async function updateProfileApi(profile: {
  displayName?: string;
  name?: string;
  email?: string;
}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({
      displayName: profile.displayName ?? profile.name,
      email: profile.email,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Profile update failed: ${res.status}`);
  }
  return res.json() as Promise<{
    userId: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl?: string;
  }>;
}

/** PATCH /api/auth/me/avatar - Update only profile image (separate API so /auth/me stays stable) */
export async function updateProfileAvatarApi(avatarUrl: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/api/auth/me/avatar`, {
    method: "PATCH",
    credentials: "include",
    headers,
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Avatar update failed: ${res.status}`);
  }
  return res.json() as Promise<{
    userId: string;
    email: string;
    role: string;
    displayName: string;
    avatarUrl?: string;
  }>;
}

function toNoteModel(n: any): Note {
  return {
    id: String(n?._id ?? n?.id ?? ""),
    content: String(n?.content ?? ""),
    taskId: n?.task_id ?? n?.taskId ?? undefined,
    projectId: n?.project_id ?? n?.projectId ?? undefined,
    userId: String(n?.user_id ?? n?.userId ?? "1"),
    createdAt: String(n?.createdAt ?? new Date().toISOString()),
    updatedAt: String(n?.updatedAt ?? new Date().toISOString()),
  };
}

export async function listNotesApi(): Promise<Note[]> {
  const res = await request<any>("/api/notes");
  const arr = Array.isArray(res) ? res : res.notes ?? [];
  return arr.map(toNoteModel);
}

export async function createNoteApi(note: Omit<Note, "id"> | Note): Promise<Note> {
  const body = {
    content: note.content,
    taskId: note.taskId,
    projectId: note.projectId,
    userId: note.userId,
  };
  const created = await request<any>("/api/notes", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return toNoteModel(created);
}

export async function updateNoteApi(id: string, updates: Partial<Note>): Promise<Note> {
  const body = {
    ...(updates.content !== undefined ? { content: updates.content } : {}),
    ...(updates.taskId !== undefined ? { taskId: updates.taskId } : {}),
    ...(updates.projectId !== undefined ? { projectId: updates.projectId } : {}),
  };
  const updated = await request<any>(`/api/notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return toNoteModel(updated);
}

export async function deleteNoteApi(id: string): Promise<void> {
  await request<void>(`/api/notes/${id}`, { method: "DELETE" });
}

function toAutomationRuleModel(r: any): AutomationRule {
  return {
    id: String(r?._id ?? r?.id ?? ""),
    name: String(r?.name ?? ""),
    trigger: String(r?.trigger ?? ""),
    triggerValue: String(r?.trigger_value ?? r?.triggerValue ?? ""),
    action: String(r?.action ?? ""),
    actionValue: String(r?.action_value ?? r?.actionValue ?? ""),
    enabled: !!r?.enabled,
    projectId: String(r?.project_id ?? r?.projectId ?? ""),
  };
}

export async function listAutomationRulesApi(projectId?: string): Promise<AutomationRule[]> {
  const q: Record<string, string> = {};
  if (projectId) q.project_id = projectId;
  const res = await apiGet<any[]>("/api/automation-rules", q);
  return (Array.isArray(res) ? res : []).map(toAutomationRuleModel);
}

export async function updateAutomationRuleApi(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
  const body = {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.trigger !== undefined ? { trigger: updates.trigger } : {}),
    ...(updates.triggerValue !== undefined ? { triggerValue: updates.triggerValue } : {}),
    ...(updates.action !== undefined ? { action: updates.action } : {}),
    ...(updates.actionValue !== undefined ? { actionValue: updates.actionValue } : {}),
    ...(updates.enabled !== undefined ? { enabled: updates.enabled } : {}),
    ...(updates.projectId !== undefined ? { projectId: updates.projectId } : {}),
  };
  const res = await apiPut<any>(`/api/automation-rules/${id}`, body);
  return toAutomationRuleModel(res);
}

export async function createAutomationRuleApi(rule: Omit<AutomationRule, "id">): Promise<AutomationRule> {
  const body = {
    name: rule.name,
    trigger: rule.trigger,
    triggerValue: rule.triggerValue,
    action: rule.action,
    actionValue: rule.actionValue,
    enabled: rule.enabled,
    projectId: rule.projectId,
  };
  const res = await apiPost<any>("/api/automation-rules", body);
  return toAutomationRuleModel(res);
}

export async function deleteAutomationRuleApi(id: string): Promise<void> {
  await request<void>(`/api/automation-rules/${id}`, { method: "DELETE" });
}

/** POST /api/automation-rules/:id/test-teams — send a test message to Teams webhook for this rule (only for send_teams_message rules) */
export async function testAutomationRuleTeamsApi(id: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(`${API_URL}/api/automation-rules/${id}/test-teams`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `Test failed: ${res.status}`);
  return data;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

function toTaskComment(c: any): TaskComment {
  return {
    id: String(c?._id ?? c?.id ?? ""),
    taskId: String(c?.task_id ?? c?.taskId ?? ""),
    userId: String(c?.user_id?._id ?? c?.user_id ?? c?.userId ?? ""),
    content: String(c?.content ?? c?.text ?? ""),
    mentions: Array.isArray(c?.mentions) ? c.mentions.map((m: any) => String(m?._id ?? m)) : [],
    createdAt: String(c?.createdAt ?? new Date().toISOString()),
  };
}

export async function listTaskCommentsApi(taskId: string): Promise<TaskComment[]> {
  const res = await apiGet<any>(`/api/comments/task/${taskId}`);
  const comments = Array.isArray(res) ? res : res.comments ?? [];
  return comments.map(toTaskComment);
}

export async function addTaskCommentApi(taskId: string, content: string): Promise<TaskComment> {
  const res = await apiPost<any>(`/api/comments/task/${taskId}`, { content });
  return toTaskComment(res.comment ?? res);
}

export interface ActivityFeedItem {
  id: string;
  taskId?: string;
  projectId?: string;
  userId: string;
  userName?: string;
  action: Activity["type"] | string;
  details: Record<string, unknown>;
  createdAt: string;
}

function toActivityFeedItem(a: any): ActivityFeedItem {
  return {
    id: String(a?.id ?? a?._id ?? ""),
    taskId: a?.taskId ?? (a?.task_id ? String(a.task_id) : undefined),
    projectId: a?.projectId ?? (a?.project_id ? String(a.project_id) : undefined),
    userId: String(a?.userId ?? a?.user_id ?? ""),
    userName: a?.userName,
    action: String(a?.action ?? ""),
    details: (a?.details ?? {}) as Record<string, unknown>,
    createdAt: String(a?.createdAt ?? new Date().toISOString()),
  };
}

export async function listActivitiesApi(projectId?: string): Promise<ActivityFeedItem[]> {
  const q: Record<string, string> = {};
  if (projectId) q.project_id = projectId;
  const res = await apiGet<any[]>("/api/activities", q);
  return (Array.isArray(res) ? res : []).map(toActivityFeedItem);
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  read: boolean;
  createdAt: string;
}

function toNotificationModel(n: any): AppNotification {
  return {
    id: String(n?.id ?? n?._id ?? ""),
    userId: String(n?.userId ?? n?.user_id ?? ""),
    type: String(n?.type ?? ""),
    title: String(n?.title ?? ""),
    message: String(n?.message ?? ""),
    taskId: n?.taskId ?? (n?.task_id ? String(n.task_id) : undefined),
    projectId: n?.projectId ?? (n?.project_id ? String(n.project_id) : undefined),
    read: !!n?.read,
    createdAt: String(n?.createdAt ?? new Date().toISOString()),
  };
}

export async function listNotificationsApi(userId?: string): Promise<AppNotification[]> {
  const q: Record<string, string> = {};
  if (userId) q.user_id = userId;
  const query = new URLSearchParams(q).toString();
  const path = query ? `/api/notifications?${query}` : "/api/notifications";
  const res = await request<any[]>(path, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return (Array.isArray(res) ? res : []).map(toNotificationModel);
}

export async function markNotificationReadApi(id: string): Promise<AppNotification> {
  const res = await request<any>(`/api/notifications/${id}/read`, { method: "PATCH" });
  return toNotificationModel(res);
}

