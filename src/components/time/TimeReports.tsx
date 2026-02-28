import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, FolderKanban, PieChart, Calendar } from 'lucide-react';

interface TimeReportsProps {
  filteredEntries: { taskId: string; userId: string; hours: number; date: string; billable: boolean }[];
  tasks: { id: string; projectId: string }[];
  projects: { id: string; name: string }[];
  canViewBilling?: boolean;
}

export function TimeReports({ filteredEntries, tasks, projects, canViewBilling = false }: TimeReportsProps) {
  const { getTeamMember } = useApp();

  const timeByUser = useMemo(() => {
    const map = new Map<string, number>();
    filteredEntries.forEach(e => {
      map.set(e.userId, (map.get(e.userId) ?? 0) + e.hours);
    });
    return Array.from(map.entries()).map(([userId, hours]) => ({
      userId,
      name: getTeamMember(userId)?.name ?? 'Unknown',
      hours,
    })).sort((a, b) => b.hours - a.hours);
  }, [filteredEntries, getTeamMember]);

  const timeByProject = useMemo(() => {
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
  }, [filteredEntries, tasks, projects]);

  const billableBreakdown = useMemo(() => {
    const billable = filteredEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
    const nonBillable = filteredEntries.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0);
    return { billable, nonBillable, total: billable + nonBillable };
  }, [filteredEntries]);

  const weeklySummary = useMemo(() => {
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
  }, [filteredEntries]);

  const monthlySummary = useMemo(() => {
    const byMonth = new Map<string, number>();
    filteredEntries.forEach(e => {
      const key = e.date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + e.hours);
    });
    return Array.from(byMonth.entries())
      .map(([month, hours]) => ({ month, hours }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [filteredEntries]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Reports
      </h3>

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
                {timeByUser.map(({ userId, name, hours }) => (
                  <div key={userId} className="flex justify-between text-sm">
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
                {timeByProject.map(({ projectId, name, hours }) => (
                  <div key={projectId} className="flex justify-between text-sm">
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
                {weeklySummary.map(({ weekStart, hours }) => (
                  <div key={weekStart} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
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
                {monthlySummary.map(({ month, hours }) => (
                  <div key={month} className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">
                      {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-lg font-display font-bold text-foreground">{hours.toFixed(1)}h</p>
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
