import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Activity as ActivityIcon, BarChart3, Users, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { canViewBilling } from '@/lib/utils';

export default function DashboardPage() {
  const { tasks, projects, activities, timeEntries, getTeamMember, user, teamMembers, currentUserId } = useApp();
  const showBilling = canViewBilling(user?.role);

  const myTasks = tasks.filter(t => t.assignees.includes(currentUserId));
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done');
  const totalHours = timeEntries.reduce((s, e) => s + e.hours, 0);
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const stats = [
    { label: 'My Tasks', value: myTasks.length, icon: CheckCircle2, color: 'text-primary' },
    { label: 'Overdue', value: overdueTasks.length, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Hours Logged', value: totalHours.toFixed(1), icon: Clock, color: 'text-warning' },
    { label: 'Completed', value: doneTasks, icon: TrendingUp, color: 'text-success' },
  ];

  // Team workload data
  const workloadData = teamMembers.map(m => ({
    name: m.name.split(' ')[0],
    tasks: tasks.filter(t => t.assignees.includes(m.id) && t.status !== 'done').length,
    completed: tasks.filter(t => t.assignees.includes(m.id) && t.status === 'done').length,
  }));

  // Time by project
  const timeByProject = projects.map(p => {
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const hours = timeEntries.filter(e => projectTasks.some(t => t.id === e.taskId)).reduce((s, e) => s + e.hours, 0);
    return { name: p.name.split(' ')[0], hours, color: p.color };
  }).filter(d => d.hours > 0);

  // Burndown mock data (simulated sprint)
  const burndownData = [
    { day: 'Mon', ideal: 10, actual: 10 },
    { day: 'Tue', ideal: 8, actual: 9 },
    { day: 'Wed', ideal: 6, actual: 7 },
    { day: 'Thu', ideal: 4, actual: 6 },
    { day: 'Fri', ideal: 2, actual: 4 },
    { day: 'Today', ideal: 0, actual: 3 },
  ];

  // Billable vs Internal (time breakdown)
  const billable = timeEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const internal = timeEntries.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0);
  const pieData = [
    { name: 'Billable', value: billable },
    { name: 'Internal', value: internal },
  ];
  const pieColors = ['hsl(142, 60%, 45%)', 'hsl(230, 10%, 45%)'];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name?.split(' ')[0] ?? 'User'}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-card-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Tasks */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3">My Tasks</h2>
            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No tasks assigned to you yet.</p>
              ) : (
                myTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${task.status === 'done' ? 'bg-status-done' : task.status === 'in_progress' ? 'bg-status-progress' : 'bg-status-todo'}`} />
                      <span className="text-sm text-card-foreground">{task.title}</span>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" /> Recent Activity
            </h2>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4">No recent activity.</p>
              ) : (
                activities.slice(0, 6).map(activity => {
                  const member = getTeamMember(activity.userId);
                  return (
                    <div key={activity.id} className="flex gap-2">
                      <UserAvatar userId={activity.userId} />
                      <div className="min-w-0">
                        <p className="text-xs text-card-foreground">
                          <span className="font-medium">{member?.name}</span>{' '}
                          <span className="text-muted-foreground">{activity.description}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(activity.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Reports Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team Workload */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Workload
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={workloadData} barGap={2}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(230, 10%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(230, 10%, 55%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(230, 22%, 10%)', border: '1px solid hsl(230, 20%, 16%)', borderRadius: 8, color: 'hsl(230, 10%, 92%)' }} />
                <Bar dataKey="tasks" fill="hsl(238, 76%, 62%)" radius={[4, 4, 0, 0]} name="Active" />
                <Bar dataKey="completed" fill="hsl(142, 60%, 45%)" radius={[4, 4, 0, 0]} name="Done" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Burndown Chart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Sprint Burndown
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 20%, 16%)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(230, 10%, 55%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(230, 10%, 55%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(230, 22%, 10%)', border: '1px solid hsl(230, 20%, 16%)', borderRadius: 8, color: 'hsl(230, 10%, 92%)' }} />
                <Line type="monotone" dataKey="ideal" stroke="hsl(230, 10%, 45%)" strokeDasharray="5 5" dot={false} name="Ideal" />
                <Line type="monotone" dataKey="actual" stroke="hsl(238, 76%, 62%)" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Time Breakdown - billable/internal only visible to Admins & Project Managers */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4" /> Time Breakdown
            </h2>
            {showBilling ? (
              <>
                <div className="relative flex items-center justify-center min-h-[200px]">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="transparent"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          fontSize: 12,
                          background: 'hsl(230, 22%, 10%)',
                          border: '1px solid hsl(230, 20%, 16%)',
                          borderRadius: 8,
                          color: 'hsl(230, 10%, 92%)',
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)}h`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    aria-hidden
                  >
                    <div className="rounded-lg bg-card/95 border border-border px-3 py-2 shadow-sm text-center min-w-[100px]">
                      <p className="text-xs text-muted-foreground font-medium">Billable</p>
                      <p className="text-lg font-display font-bold text-card-foreground tabular-nums">
                        {billable.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 text-xs mt-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full bg-[hsl(142,60%,45%)]" aria-hidden />
                    Billable: {billable.toFixed(2)}h
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" aria-hidden />
                    Internal: {internal.toFixed(2)}h
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-sm text-muted-foreground">Total: {(billable + internal).toFixed(1)}h</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Progress */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-display font-semibold text-card-foreground mb-3">Project Progress</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground col-span-full py-4">No projects yet.</p>
            ) : (
            projects.map(project => {
              const projectTasks = tasks.filter(t => t.projectId === project.id);
              const doneCount = projectTasks.filter(t => t.status === 'done').length;
              const progress = projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : project.progress;
              return (
              <div key={project.id} className="p-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="text-sm font-medium text-card-foreground">{project.name}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: project.color }} />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">{progress}% complete</span>
              </div>
              );
            })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
