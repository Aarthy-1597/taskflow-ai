import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { ThemeMode } from '@/data/types';
import { motion } from 'framer-motion';
import { Sun, Moon, Minimize2, Palette } from 'lucide-react';

const themes: { value: ThemeMode; label: string; desc: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', desc: 'Clean bright interface', icon: Sun },
  { value: 'dark', label: 'Dark', desc: 'Easy on the eyes', icon: Moon },
  { value: 'minimal', label: 'Minimal', desc: 'Reduced visual noise', icon: Minimize2 },
];

export default function SettingsPage() {
  const { theme, setTheme } = useApp();

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences</p>
        </motion.div>

        {/* Theme Selection */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-display font-semibold text-card-foreground mb-1 flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Appearance
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Choose your preferred theme</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(t => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  theme === t.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <t.icon className={`h-5 w-5 mb-2 ${theme === t.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <h3 className="text-sm font-semibold text-card-foreground">{t.label}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Other Settings */}
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
