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

export async function fetchInitialBoardData() {
  const [projects, tasks, users] = await Promise.all([
    request<Project[]>("/api/projects"),
    request<Task[]>("/api/tasks"),
    request<TeamMember[]>("/api/users"),
  ]);
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
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

