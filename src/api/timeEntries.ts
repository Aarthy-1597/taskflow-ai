import { TimeEntry } from '@/data/types';

/** Python Time Tracking API (port 8000) - separate from Node.js projects/tasks API */
const TIME_API_URL = import.meta.env.VITE_TIME_API_URL ?? '';

async function timeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : TIME_API_URL
      ? `${TIME_API_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`
      : path;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Time API request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

function timeGet<T>(path: string, q?: Record<string, string>): Promise<T> {
  const url = q && Object.keys(q).length > 0 ? `${path}?${new URLSearchParams(q).toString()}` : path;
  return timeRequest<T>(url);
}

function timePost<T>(path: string, body?: unknown): Promise<T> {
  return timeRequest<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined });
}

function timePut<T>(path: string, body?: unknown): Promise<T> {
  return timeRequest<T>(path, { method: 'PUT', body: body != null ? JSON.stringify(body) : undefined });
}

function timeDelete(path: string): Promise<void> {
  return timeRequest<void>(path, { method: 'DELETE' });
}

/** API response uses snake_case */
interface TimeEntryApi {
  id: string;
  task_id: string;
  user_id: string;
  project_id?: string;
  hours: number;
  date: string;
  description: string;
  billable: boolean;
  /** Server-side timer: true when timer is running in MongoDB */
  timer_running?: boolean;
  /** Server-side timer: ISO datetime when timer was started */
  timer_start?: string;
}

function toEntry(api: TimeEntryApi): TimeEntry {
  return {
    id: api.id,
    taskId: api.task_id,
    userId: api.user_id,
    hours: api.hours,
    date: api.date,
    description: api.description,
    billable: api.billable,
  };
}

export interface ListTimeEntriesParams {
  user_id?: string;
  task_id?: string;
  project_id?: string;
  billable?: boolean;
  date_from?: string;
  date_to?: string;
}

/**
 * Create manual time entry
 * POST /api/time-entries/
 * Payload matches Time Tracking API spec (Postman collection)
 */
export interface CreateTimeEntryPayload {
  task_id: string;
  user_id: string;
  project_id: string;
  hours: number;
  date: string; // YYYY-MM-DD
  description: string;
  billable: boolean;
}

export async function createTimeEntry(entry: CreateTimeEntryPayload): Promise<TimeEntry> {
  const payload: CreateTimeEntryPayload = {
    task_id: entry.task_id,
    user_id: entry.user_id,
    project_id: entry.project_id,
    hours: entry.hours,
    date: entry.date,
    description: entry.description ?? '',
    billable: entry.billable,
  };
  const res = await timePost<TimeEntryApi>('/api/time-entries/', payload);
  return toEntry(res);
}

/** 2. List all entries with optional filters */
export async function listTimeEntries(params?: ListTimeEntriesParams): Promise<TimeEntry[]> {
  const q: Record<string, string> = {};
  if (params?.user_id) q.user_id = params.user_id;
  if (params?.task_id) q.task_id = params.task_id;
  if (params?.project_id) q.project_id = params.project_id;
  if (params?.billable !== undefined) q.billable = String(params.billable);
  if (params?.date_from) q.date_from = params.date_from;
  if (params?.date_to) q.date_to = params.date_to;

  const res = await timeGet<TimeEntryApi[] | { results?: TimeEntryApi[] }>('/api/time-entries/', q);
  const arr = Array.isArray(res) ? res : (res.results ?? []);
  return arr.map(toEntry);
}

/** 3. Update entry (partial) */
export async function updateTimeEntry(id: string, updates: Partial<{
  task_id: string;
  user_id: string;
  project_id: string;
  hours: number;
  date: string;
  description: string;
  billable: boolean;
}>): Promise<TimeEntry> {
  const body: Record<string, unknown> = {};
  if (updates.task_id !== undefined) body.task_id = updates.task_id;
  if (updates.user_id !== undefined) body.user_id = updates.user_id;
  if (updates.project_id !== undefined) body.project_id = updates.project_id;
  if (updates.hours !== undefined) body.hours = updates.hours;
  if (updates.date !== undefined) body.date = updates.date;
  if (updates.description !== undefined) body.description = updates.description;
  if (updates.billable !== undefined) body.billable = updates.billable;

  const res = await timePut<TimeEntryApi>(`/api/time-entries/${id}/`, body);
  return toEntry(res);
}

/** 4. Delete entry */
export async function deleteTimeEntryApi(id: string): Promise<void> {
  await timeDelete(`/api/time-entries/${id}/`);
}

/** Active timer from GET /api/time-entries/?user_id=xxx — entry with timer_running: true */
export interface ActiveTimerFromList {
  task_id: string;
  user_id: string;
  project_id?: string;
  timer_start: string; // ISO datetime from MongoDB
  description?: string;
  billable?: boolean;
}

/**
 * Get active running timer from server (MongoDB).
 * Calls GET /api/time-entries/?user_id=xxx and finds entry with timer_running: true.
 * Elapsed = NOW - timer_start (calculated client-side for live display).
 */
export async function getActiveTimer(userId: string): Promise<ActiveTimerFromList | null> {
  try {
    const res = await timeGet<TimeEntryApi[] | { results?: TimeEntryApi[] }>('/api/time-entries/', { user_id: userId });
    const arr = Array.isArray(res) ? res : (res?.results ?? []);
    const running = arr.find((e: TimeEntryApi) => e.timer_running === true && e.timer_start);
    if (!running?.timer_start) return null;
    return {
      task_id: running.task_id,
      user_id: running.user_id,
      project_id: running.project_id,
      timer_start: running.timer_start,
      description: running.description,
      billable: running.billable,
    };
  } catch {
    return null;
  }
}

/** 5. Start live timer — MongoDB stores timer_running: true, timer_start */
export async function startTimer(params: {
  task_id: string;
  user_id: string;
  project_id: string;
  description?: string;
  billable?: boolean;
}): Promise<{ id?: string; started_at?: string; timer_start?: string }> {
  return timePost('/api/time-entries/start-timer/', params);
}

/** 6. Stop timer (auto-calculates hours) */
export async function stopTimer(params: {
  task_id: string;
  user_id: string;
  description?: string;
  billable?: boolean;
}): Promise<TimeEntry> {
  const res = await timePost<TimeEntryApi>('/api/time-entries/stop-timer/', params);
  return toEntry(res);
}

/** Report group types - GET /api/time-reports/?group_by=xxx */
export type ReportGroupBy = 'user' | 'project' | 'billable' | 'weekly' | 'monthly';

export interface ReportParams {
  group_by: ReportGroupBy;
  user_id?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
}

/** Report row - API may return user_id/user_name/name, project_id/project_name/name, billable/hours, week_start, month (snake_case) */
export interface ReportRow {
  user_id?: string;
  user_name?: string;
  name?: string;
  project_id?: string;
  project_name?: string;
  hours: number;
  billable?: boolean | number;
  non_billable?: number;
  week_start?: string;
  weekStart?: string;
  month?: string;
}

/** API report response - either array/results OR object with breakdown */
export type ReportApiResponse =
  | ReportRow[]
  | { results?: ReportRow[] }
  | ReportBreakdownResponse;

/** Breakdown item - supports user/project reports with user_name, project_name */
export interface ReportBreakdownItem {
  total_hours?: number;
  billable_hours?: number;
  entry_count?: number;
  user_name?: string;
  project_name?: string;
  name?: string;
}

/** Breakdown format: { group_by, total_entries, total_hours, billable_hours, non_billable_hours, breakdown } */
export interface ReportBreakdownResponse {
  group_by?: string;
  total_entries?: number;
  total_hours?: number;
  billable_hours?: number;
  non_billable_hours?: number;
  breakdown?: Record<string, ReportBreakdownItem>;
}

/** 7. Get reports - GET /api/time-reports/?group_by=user|project|billable|weekly|monthly */
export async function getTimeReports(params: ReportParams): Promise<ReportApiResponse> {
  const q: Record<string, string> = { group_by: params.group_by };
  if (params.user_id) q.user_id = params.user_id;
  if (params.project_id) q.project_id = params.project_id;
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;
  return timeGet<ReportApiResponse>('/api/time-reports/', q);
}
