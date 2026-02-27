import type { Project, Task, TeamMember } from "@/data/types";

const API_URL = import.meta.env.VITE_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
  }
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }
  return (await res.json()) as T;
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

export async function fetchInitialBoardData() {
  const [projectsRaw, tasksRaw, usersRaw] = await Promise.all([
    request<any>("/api/projects"),
    request<any>("/api/tasks"),
    request<any>("/api/users"),
  ]);

  const projects = (Array.isArray(projectsRaw) ? projectsRaw : projectsRaw.projects ?? []).map(
    (p: any): Project => ({
      id: String(p._id ?? p.id ?? ""),
      name: String(p.name ?? ""),
      description: String(p.description ?? ""),
      status: (String(p.status ?? "active").toLowerCase().replace(" ", "_") as Project["status"]),
      color: String(p.color ?? "#4F46E5"),
      startDate: (p.start_date ?? p.startDate ?? new Date()).toISOString?.().slice(0, 10) ?? String(p.start_date ?? p.startDate ?? ""),
      dueDate: (p.end_date ?? p.dueDate ?? "").toISOString?.().slice(0, 10) ?? String(p.end_date ?? p.dueDate ?? ""),
      members: Array.isArray(p.team_members)
        ? p.team_members.map((m: any) => String(m._id ?? m.id ?? m))
        : Array.isArray(p.members)
        ? p.members.map((id: any) => String(id))
        : [],
      progress: typeof p.task_count === "number" ? p.task_count : typeof p.progress === "number" ? p.progress : 0,
    })
  );

  const tasks = (Array.isArray(tasksRaw) ? tasksRaw : tasksRaw.tasks ?? []).map(
    (t: any): Task => ({
      id: String(t._id ?? t.id ?? ""),
      title: String(t.title ?? ""),
      description: String(t.description ?? ""),
      status: (String(t.status ?? "todo").toLowerCase().replace(" ", "_") as Task["status"]),
      priority: (String(t.priority ?? "medium").toLowerCase() as Task["priority"]),
      assignees: Array.isArray(t.assignees)
        ? t.assignees.map((a: any) => String(a._id ?? a.id ?? a))
        : [],
      projectId: String(t.project_id ?? t.projectId ?? ""),
      dueDate: (t.due_date ?? t.dueDate ?? "").toISOString?.().slice(0, 10) ?? String(t.due_date ?? t.dueDate ?? ""),
      labels: Array.isArray(t.labels) ? t.labels.map((x: any) => String(x)) : [],
      attachments: [],
      subtasks: [],
      blockedBy: Array.isArray(t.blocked_by)
        ? t.blocked_by.map((b: any) => String(b._id ?? b.id ?? b))
        : Array.isArray(t.blockedBy)
        ? t.blockedBy.map((id: any) => String(id))
        : [],
      commentCount: typeof t.commentCount === "number" ? t.commentCount : 0,
      order: typeof t.order === "number" ? t.order : 0,
    })
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
  return request<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateProject(id: string, body: Partial<Project>): Promise<Project> {
  return request<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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
    status: body.status
      ? String(body.status)
          .replace("_", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "To Do",
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

  return {
    id: String(t._id ?? t.id ?? ""),
    title: String(t.title ?? ""),
    description: String(t.description ?? ""),
    status: (String(t.status ?? "todo").toLowerCase().replace(" ", "_") as Task["status"]),
    priority: (String(t.priority ?? "medium").toLowerCase() as Task["priority"]),
    assignees: Array.isArray(t.assignees)
      ? t.assignees.map((a: any) => String(a._id ?? a.id ?? a))
      : [],
    projectId: String(t.project_id ?? t.projectId ?? body.projectId),
    dueDate: (t.due_date ?? t.dueDate ?? body.dueDate ?? "").toISOString?.().slice(0, 10) ??
      String(t.due_date ?? t.dueDate ?? body.dueDate ?? ""),
    labels: Array.isArray(t.labels) ? t.labels.map((x: any) => String(x)) : body.labels ?? [],
    attachments: [],
    subtasks: [],
    blockedBy: Array.isArray(t.blocked_by)
      ? t.blocked_by.map((b: any) => String(b._id ?? b.id ?? b))
      : body.blockedBy ?? [],
    commentCount: typeof t.commentCount === "number" ? t.commentCount : body.commentCount ?? 0,
    order: typeof t.order === "number" ? t.order : body.order ?? 0,
  };
}

export async function apiUpdateTask(id: string, body: Partial<Task>): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiDeleteTask(id: string): Promise<void> {
  await request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

// Auth / user helpers
export async function fetchCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }
  return res.json() as Promise<{
    userId: string;
    email: string;
    role: string;
    microsoftId: string;
    displayName: string;
  }>;
}

