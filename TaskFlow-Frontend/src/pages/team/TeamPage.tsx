import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { teamMembers } from '@/data/mockData';

export default function TeamPage() {
  const roleLabels: Record<string, string> = { admin: 'Admin', project_manager: 'Project Manager', member: 'Team Member' };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">Your team members and their roles</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-lg border border-border bg-card hover-lift"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-display font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                    member.status === 'online' ? 'bg-success' : member.status === 'away' ? 'bg-warning' : 'bg-muted-foreground'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{member.name}</h3>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {roleLabels[member.role]}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">{member.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
