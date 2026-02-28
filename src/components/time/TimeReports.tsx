import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, FolderKanban, PieChart, Calendar, Loader2 } from 'lucide-react';
import * as timeEntriesApi from '@/api/timeEntries';

interface TimeReportsProps {
  filteredEntries: { taskId: string; userId: string; hours: number; date: string; billable: boolean }[];
  tasks: { id: string; projectId: string }[];
  projects: { id: string; name: string }[];
  canViewBilling?: boolean;
  userFilter?: string;
  projectFilter?: string;
  dateFrom?: string;
  dateTo?: string;
  currentUserId?: string;
}

function toArray<T>(res: T[] | { results?: T[] }): T[] {
  return Array.isArray(res) ? res : (res?.results ?? []);
}

/** Check if response is breakdown format */
function isBreakdownResponse(r: unknown): r is timeEntriesApi.ReportBreakdownResponse {
  return r != null && typeof r === 'object' && 'breakdown' in r && typeof (r as Record<string, unknown>).breakdown === 'object';
}

/** Parse ISO week (2026-W09) to week start date for display */
function isoWeekToDate(isoWeek: string): string {
  const m = isoWeek.match(/^(\d{4})-W(\d{1,2})$/);
  if (!m) return isoWeek;
  const year = parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const firstMonday = new Date(year, 0, 1 + mondayOffset);
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  return weekStart.toISOString().slice(0, 10);
}

export function TimeReports({
  filteredEntries,
  tasks,
  projects,
  canViewBilling = false,
  userFilter = 'all',
  projectFilter = 'all',
  dateFrom = '',
  dateTo = '',
  currentUserId = '',
}: TimeReportsProps) {
  const { getTeamMember } = useApp();
  const [apiData, setApiData] = useState<{
    totalHours: number;
    totalEntries?: number;
    user: { userId: string; name: string; hours: number }[];
    project: { projectId: string; name: string; hours: number }[];
    billable: { billable: number; nonBillable: number };
    weekly: { weekStart: string; hours: number; entryCount?: number }[];
    monthly: { month: string; hours: number; entryCount?: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const reportParams = useMemo(() => {
    const p: timeEntriesApi.ReportParams = { group_by: 'user' };
    if (userFilter !== 'all') p.user_id = userFilter;
    if (projectFilter !== 'all') p.project_id = projectFilter;
    if (dateFrom) p.date_from = dateFrom;
    if (dateTo) p.date_to = dateTo;
    return p;
  }, [userFilter, projectFilter, dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [userRes, projectRes, billableRes, weeklyRes, monthlyRes] = await Promise.all([
          timeEntriesApi.getTimeReports({ ...reportParams, group_by: 'user' }),
          timeEntriesApi.getTimeReports({ ...reportParams, group_by: 'project' }),
          timeEntriesApi.getTimeReports({ ...reportParams, group_by: 'billable' }),
          timeEntriesApi.getTimeReports({ ...reportParams, group_by: 'weekly' }),
          timeEntriesApi.getTimeReports({ ...reportParams, group_by: 'monthly' }),
        ]);

        if (cancelled) return;

        const getStr = (r: Record<string, unknown>, ...keys: string[]) => keys.map(k => r[k]).find(v => typeof v === 'string') as string | undefined;

        let userData: { userId: string; name: string; hours: number }[];
        if (isBreakdownResponse(userRes) && userRes.breakdown) {
          userData = Object.entries(userRes.breakdown)
            .map(([userId, val]) => {
              const v = val as Record<string, unknown>;
              const name = getStr(v, 'user_name', 'userName', 'name', 'display_name', 'displayName') ?? getTeamMember(userId)?.name ?? 'Unknown';
              return { userId, name: name || 'Unknown', hours: val?.total_hours ?? 0 };
            })
            .filter(u => u.hours > 0)
            .sort((a, b) => b.hours - a.hours);
        } else {
          const userRows = toArray(userRes as timeEntriesApi.ReportRow[] | { results?: timeEntriesApi.ReportRow[] });
          userData = userRows.map((r: timeEntriesApi.ReportRow) => {
            const row = r as Record<string, unknown>;
            const name = getStr(row, 'user_name', 'userName', 'name', 'display_name', 'displayName') ?? getTeamMember(r.user_id ?? '')?.name ?? 'Unknown';
            return { userId: r.user_id ?? '', name: name || 'Unknown', hours: r.hours ?? 0 };
          }).sort((a, b) => b.hours - a.hours);
        }

        let projectData: { projectId: string; name: string; hours: number }[];
        if (isBreakdownResponse(projectRes) && projectRes.breakdown) {
          projectData = Object.entries(projectRes.breakdown)
            .map(([projectId, val]) => {
              const v = val as Record<string, unknown>;
              const name = getStr(v, 'project_name', 'projectName', 'name') ?? projects.find(p => p.id === projectId)?.name ?? 'Unknown';
              return { projectId, name: name || 'Unknown', hours: val?.total_hours ?? 0 };
            })
            .filter(p => p.hours > 0)
            .sort((a, b) => b.hours - a.hours);
        } else {
          const projectRows = toArray(projectRes as timeEntriesApi.ReportRow[] | { results?: timeEntriesApi.ReportRow[] });
          projectData = projectRows.map((r: timeEntriesApi.ReportRow) => {
            const row = r as Record<string, unknown>;
            const name = getStr(row, 'project_name', 'projectName', 'name') ?? projects.find(p => p.id === r.project_id)?.name ?? 'Unknown';
            return { projectId: r.project_id ?? '', name: name || 'Unknown', hours: r.hours ?? 0 };
          }).sort((a, b) => b.hours - a.hours);
        }

        const billableRows = toArray(billableRes as timeEntriesApi.ReportRow[] | { results?: timeEntriesApi.ReportRow[] });

        let billableData = { billable: 0, nonBillable: 0 };
        if (isBreakdownResponse(billableRes) && ((billableRes.billable_hours ?? 0) > 0 || (billableRes.non_billable_hours ?? 0) > 0)) {
          billableData = {
            billable: billableRes.billable_hours ?? 0,
            nonBillable: billableRes.non_billable_hours ?? 0,
          };
        } else if (isBreakdownResponse(weeklyRes) && ((weeklyRes.billable_hours ?? 0) > 0 || (weeklyRes.non_billable_hours ?? 0) > 0)) {
          billableData = {
            billable: weeklyRes.billable_hours ?? 0,
            nonBillable: weeklyRes.non_billable_hours ?? 0,
          };
        } else if (isBreakdownResponse(monthlyRes) && ((monthlyRes.billable_hours ?? 0) > 0 || (monthlyRes.non_billable_hours ?? 0) > 0)) {
          billableData = {
            billable: monthlyRes.billable_hours ?? 0,
            nonBillable: monthlyRes.non_billable_hours ?? 0,
          };
        } else if (billableRows.length > 0) {
          const first = billableRows[0] as Record<string, unknown>;
          if (typeof first.billable === 'number' && typeof first.non_billable === 'number') {
            billableData = { billable: Number(first.billable), nonBillable: Number(first.non_billable) };
          } else {
            billableData = billableRows.reduce((acc: { billable: number; nonBillable: number }, r: timeEntriesApi.ReportRow) => {
              if (r.billable) acc.billable += r.hours ?? 0;
              else acc.nonBillable += r.hours ?? 0;
              return acc;
            }, { billable: 0, nonBillable: 0 });
          }
        }

        let weeklyData: { weekStart: string; hours: number; entryCount?: number }[];
        if (isBreakdownResponse(weeklyRes) && weeklyRes.breakdown) {
          weeklyData = Object.entries(weeklyRes.breakdown)
            .map(([key, val]) => ({
              weekStart: key.startsWith('2') && key.includes('-W') ? isoWeekToDate(key) : key,
              hours: val?.total_hours ?? 0,
              entryCount: val?.entry_count,
            }))
            .filter(r => r.hours > 0)
            .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
            .slice(-4);
        } else {
          const weeklyRows = toArray(weeklyRes as timeEntriesApi.ReportRow[] | { results?: timeEntriesApi.ReportRow[] });
          weeklyData = weeklyRows.map((r: timeEntriesApi.ReportRow) => ({
            weekStart: (r as Record<string, unknown>).week_start ?? (r as Record<string, unknown>).weekStart ?? '',
            hours: r.hours ?? 0,
          })).filter(r => r.weekStart).sort((a, b) => a.weekStart.localeCompare(b.weekStart)).slice(-4);
        }

        let monthlyData: { month: string; hours: number; entryCount?: number }[];
        if (isBreakdownResponse(monthlyRes) && monthlyRes.breakdown) {
          monthlyData = Object.entries(monthlyRes.breakdown)
            .map(([key, val]) => ({
              month: key,
              hours: val?.total_hours ?? 0,
              entryCount: val?.entry_count,
            }))
            .filter(r => r.hours > 0)
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6);
        } else {
          const monthlyRows = toArray(monthlyRes as timeEntriesApi.ReportRow[] | { results?: timeEntriesApi.ReportRow[] });
          monthlyData = monthlyRows.map((r: timeEntriesApi.ReportRow) => ({
            month: r.month ?? '',
            hours: r.hours ?? 0,
          })).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
        }

        const totalHours = (isBreakdownResponse(weeklyRes) && (weeklyRes.total_hours ?? 0) > 0)
          ? (weeklyRes.total_hours ?? 0)
          : (isBreakdownResponse(monthlyRes) && (monthlyRes.total_hours ?? 0) > 0)
            ? (monthlyRes.total_hours ?? 0)
            : (billableData.billable + billableData.nonBillable) > 0
              ? billableData.billable + billableData.nonBillable
              : userData.reduce((s, u) => s + u.hours, 0) || projectData.reduce((s, p) => s + p.hours, 0) || weeklyData.reduce((s, w) => s + w.hours, 0) || monthlyData.reduce((s, m) => s + m.hours, 0);

        const totalEntries = (isBreakdownResponse(weeklyRes) && weeklyRes.total_entries) ?? (isBreakdownResponse(monthlyRes) && monthlyRes.total_entries);

        setApiData({
          totalHours,
          totalEntries,
          user: userData,
          project: projectData,
          billable: billableData,
          weekly: weeklyData,
          monthly: monthlyData,
        });
      } catch (err) {
        console.error('[TimeReports] API failed:', err);
        setApiData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reportParams, getTeamMember, projects]);

  return <TimeReportsContent
    apiData={apiData}
    loading={loading}
    filteredEntries={filteredEntries}
    tasks={tasks}
    projects={projects}
    getTeamMember={getTeamMember}
    canViewBilling={canViewBilling}
  />;
}

function TimeReportsContent({
  apiData,
  loading,
  filteredEntries,
  tasks,
  projects,
  getTeamMember,
  canViewBilling,
}: {
  apiData: { totalHours: number; totalEntries?: number; user: { userId: string; name: string; hours: number }[]; project: { projectId: string; name: string; hours: number }[]; billable: { billable: number; nonBillable: number }; weekly: { weekStart: string; hours: number; entryCount?: number }[]; monthly: { month: string; hours: number; entryCount?: number }[] } | null;
  loading: boolean;
  filteredEntries: { taskId: string; userId: string; hours: number; date: string; billable: boolean }[];
  tasks: { id: string; projectId: string }[];
  projects: { id: string; name: string }[];
  getTeamMember: (id: string) => { name: string } | undefined;
  canViewBilling: boolean;
}) {
  const timeByUser = useMemo(() => {
    if (apiData?.user?.length) return apiData.user;
    const map = new Map<string, number>();
    filteredEntries.forEach(e => {
      map.set(e.userId, (map.get(e.userId) ?? 0) + e.hours);
    });
    return Array.from(map.entries()).map(([userId, hours]) => ({
      userId,
      name: getTeamMember(userId)?.name ?? 'Unknown',
      hours,
    })).sort((a, b) => b.hours - a.hours);
  }, [apiData?.user, filteredEntries, getTeamMember]);

  const timeByProject = useMemo(() => {
    if (apiData?.project?.length) return apiData.project;
    const map = new Map<string, number>();
    filteredEntries.forEach(e => {
      const task = tasks.find(t => t.id === e.taskId);
      const projectId = task?.projectId ?? 'unknown';
      map.set(projectId, (map.get(projectId) ?? 0) + e.hours);
    });
    return Array.from(map.entries()).map(([projectId, hours]) => ({
      projectId,
      name: projects.find(p => p.id === projectId)?.name ?? 'Unknown',
      hours,
    })).sort((a, b) => b.hours - a.hours);
  }, [apiData?.project, filteredEntries, tasks, projects]);

  const billableBreakdown = useMemo(() => {
    if (apiData?.billable && (apiData.billable.billable > 0 || apiData.billable.nonBillable > 0)) {
      return { ...apiData.billable, total: apiData.billable.billable + apiData.billable.nonBillable };
    }
    const billable = filteredEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
    const nonBillable = filteredEntries.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0);
    return { billable, nonBillable, total: billable + nonBillable };
  }, [apiData?.billable, filteredEntries]);

  const weeklySummary = useMemo(() => {
    if (apiData?.weekly?.length) return apiData.weekly;
    const byWeek = new Map<string, number>();
    filteredEntries.forEach(e => {
      const d = new Date(e.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      byWeek.set(key, (byWeek.get(key) ?? 0) + e.hours);
    });
    return Array.from(byWeek.entries())
      .map(([weekStart, hours]) => ({ weekStart, hours }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      .slice(-4);
  }, [apiData?.weekly, filteredEntries]);

  const monthlySummary = useMemo(() => {
    if (apiData?.monthly?.length) return apiData.monthly;
    const byMonth = new Map<string, number>();
    filteredEntries.forEach(e => {
      const key = e.date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + e.hours);
    });
    return Array.from(byMonth.entries())
      .map(([month, hours]) => ({ month, hours }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [apiData?.monthly, filteredEntries]);

  const totalHours = apiData?.totalHours ?? ((billableBreakdown.billable + billableBreakdown.nonBillable) || filteredEntries.reduce((s, e) => s + e.hours, 0));
  const totalEntries = apiData?.totalEntries ?? filteredEntries.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Reports
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </h3>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-xl font-display font-bold text-foreground">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Entries</p>
            <p className="text-xl font-display font-bold text-foreground">{totalEntries}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Time by User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeByUser.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-2">
                {timeByUser.map(({ userId, name, hours }, i) => (
                  <div key={userId || `user-${i}`} className="flex justify-between text-sm">
                    <span className="text-foreground">{name}</span>
                    <span className="font-display font-medium">{hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Time by Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeByProject.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-2">
                {timeByProject.map(({ projectId, name, hours }, i) => (
                  <div key={projectId || `project-${i}`} className="flex justify-between text-sm">
                    <span className="text-foreground truncate">{name}</span>
                    <span className="font-display font-medium shrink-0 ml-2">{hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {canViewBilling && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Billable vs Non-Billable
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billableBreakdown.total === 0 ? (
                <p className="text-sm text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-success">Billable</span>
                    <span className="font-display font-medium">{billableBreakdown.billable.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Non-Billable</span>
                    <span className="font-display font-medium">{billableBreakdown.nonBillable.toFixed(1)}h</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex h-2 rounded overflow-hidden gap-px">
                      <div
                        className="bg-success"
                        style={{ width: `${(billableBreakdown.billable / billableBreakdown.total) * 100}%` }}
                      />
                      <div
                        className="bg-muted"
                        style={{ width: `${(billableBreakdown.nonBillable / billableBreakdown.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklySummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="space-y-2">
                {weeklySummary.map(({ weekStart, hours, entryCount }) => (
                  <div key={weekStart} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-muted-foreground block">
                        Week of {weekStart.length === 10 ? new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : weekStart}
                      </span>
                      {entryCount != null && <span className="text-xs text-muted-foreground">{entryCount} entries</span>}
                    </div>
                    <span className="font-display font-medium">{hours.toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlySummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {monthlySummary.map(({ month, hours, entryCount }) => (
                  <div key={month} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">
                      {month.length >= 7 ? new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : month}
                    </p>
                    <p className="text-lg font-display font-bold text-foreground">{hours.toFixed(1)}h</p>
                    {entryCount != null && <p className="text-xs text-muted-foreground">{entryCount} entries</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
