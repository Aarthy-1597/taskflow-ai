import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Activity as ActivityIcon } from 'lucide-react';
import { teamMembers } from '@/data/mockData';

export default function DashboardPage() {
  const { tasks, projects, activities, timeEntries, getTeamMember } = useApp();

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

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back, Alex</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg border border-border bg-card"
            >
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
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                  />
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
