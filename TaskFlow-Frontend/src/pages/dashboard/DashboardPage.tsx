import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Activity as ActivityIcon, BarChart3, Users, Timer } from 'lucide-react';
import { teamMembers } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { tasks, projects, activities, timeEntries, getTeamMember, user } = useApp();

  const myTasks = tasks.filter(t => t.assignee === '1');
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
    tasks: tasks.filter(t => t.assignee === m.id && t.status !== 'done').length,
    completed: tasks.filter(t => t.assignee === m.id && t.status === 'done').length,
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

  // Billable vs non-billable
  const billable = timeEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const nonBillable = timeEntries.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0);
  const pieData = [
    { name: 'Billable', value: billable },
    { name: 'Non-Billable', value: nonBillable },
  ];
  const pieColors = ['hsl(142, 60%, 45%)', 'hsl(230, 10%, 45%)'];

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name.split(' ')[0] || 'User'}</p>
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
              {myTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${task.status === 'done' ? 'bg-status-done' : task.status === 'in_progress' ? 'bg-status-progress' : 'bg-status-todo'}`} />
                    <span className="text-sm text-card-foreground">{task.title}</span>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4" /> Recent Activity
            </h2>
            <div className="space-y-3">
              {activities.slice(0, 6).map(activity => {
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
              })}
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

          {/* Time Breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-display font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4" /> Time Breakdown
            </h2>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, background: 'hsl(230, 22%, 10%)', border: '1px solid hsl(230, 20%, 16%)', borderRadius: 8, color: 'hsl(230, 10%, 92%)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[10px]">
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-success" />Billable: {billable}h</span>
              <span className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-muted-foreground" />Internal: {nonBillable}h</span>
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-display font-semibold text-card-foreground mb-3">Project Progress</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {projects.map(project => (
              <div key={project.id} className="p-3 rounded-md bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                  <span className="text-sm font-medium text-card-foreground">{project.name}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">{project.progress}% complete</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
