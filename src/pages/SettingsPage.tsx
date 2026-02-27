import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences</p>
        </motion.div>

        <div className="space-y-4">
          {['General', 'Notifications', 'Integrations', 'Security'].map((section, i) => (
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer"
            >
              <h3 className="text-sm font-semibold text-card-foreground">{section}</h3>
              <p className="text-xs text-muted-foreground mt-1">Configure {section.toLowerCase()} settings</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
