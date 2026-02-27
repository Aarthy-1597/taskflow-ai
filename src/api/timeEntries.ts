import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { TimeEntry } from '@/data/types';

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

/** 1. Create manual time entry */
export async function createTimeEntry(entry: {
  task_id: string;
  user_id: string;
  project_id: string;
  hours: number;
  date: string;
  description: string;
  billable: boolean;
}): Promise<TimeEntry> {
  const res = await apiPost<TimeEntryApi>('/api/time-entries/', entry);
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

  const res = await apiGet<TimeEntryApi[] | { results?: TimeEntryApi[] }>('/api/time-entries/', q);
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

  const res = await apiPut<TimeEntryApi>(`/api/time-entries/${id}/`, body);
  return toEntry(res);
}

/** 4. Delete entry */
export async function deleteTimeEntryApi(id: string): Promise<void> {
  await apiDelete(`/api/time-entries/${id}/`);
}

/** 5. Start live timer */
export async function startTimer(params: {
  task_id: string;
  user_id: string;
  project_id: string;
  description?: string;
  billable?: boolean;
}): Promise<{ id?: string; started_at?: string }> {
  return apiPost('/api/time-entries/start-timer/', params);
}

/** 6. Stop timer (auto-calculates hours) */
export async function stopTimer(params: {
  task_id: string;
  user_id: string;
  description?: string;
  billable?: boolean;
}): Promise<TimeEntry> {
  const res = await apiPost<TimeEntryApi>('/api/time-entries/stop-timer/', params);
  return toEntry(res);
}

/** Report group types */
export type ReportGroupBy = 'user' | 'project' | 'billable' | 'weekly' | 'monthly';

export interface ReportParams {
  group_by: ReportGroupBy;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

/** 7. Get reports */
export async function getTimeReports(params: ReportParams): Promise<unknown> {
  const q: Record<string, string> = { group_by: params.group_by };
  if (params.user_id) q.user_id = params.user_id;
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;
  return apiGet('/api/time-reports/', q);
}
