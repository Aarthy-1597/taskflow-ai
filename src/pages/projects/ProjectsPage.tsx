import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Calendar, Users } from 'lucide-react';

export default function ProjectsPage() {
  const { projects } = useApp();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your team's projects</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-lg border border-border bg-card hover-lift cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                  <h3 className="text-sm font-display font-semibold text-card-foreground">{project.name}</h3>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  project.status === 'active' ? 'bg-success/10 text-success' :
                  project.status === 'on_hold' ? 'bg-warning/10 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {project.status === 'active' ? 'Active' : project.status === 'on_hold' ? 'On Hold' : 'Done'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-4">{project.description}</p>

              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {project.members.slice(0, 3).map(m => (
                    <UserAvatar key={m} userId={m} />
                  ))}
                  {project.members.length > 3 && (
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground border-2 border-card">
                      +{project.members.length - 3}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
