import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { motion } from 'framer-motion';
import { Clock, Play, Square, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function TimePage() {
  const { timeEntries, tasks, getTeamMember } = useApp();
  const [timerRunning, setTimerRunning] = useState(false);

  const totalBillable = timeEntries.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const totalNonBillable = timeEntries.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-foreground">Time Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your work hours</p>
        </motion.div>

        {/* Timer */}
        <div className="p-5 rounded-lg border border-border bg-card flex items-center gap-4">
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className={`p-3 rounded-lg transition-colors ${
              timerRunning ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
            }`}
          >
            {timerRunning ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <div>
            <p className="text-3xl font-display font-bold text-card-foreground tracking-wider">
              {timerRunning ? '00:12:34' : '00:00:00'}
            </p>
            <p className="text-xs text-muted-foreground">{timerRunning ? 'Timer running...' : 'Click play to start'}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Hours</span>
            </div>
            <p className="text-xl font-display font-bold text-card-foreground">{(totalBillable + totalNonBillable).toFixed(1)}h</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Billable</span>
            </div>
            <p className="text-xl font-display font-bold text-card-foreground">{totalBillable.toFixed(1)}h</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Non-Billable</span>
            </div>
            <p className="text-xl font-display font-bold text-card-foreground">{totalNonBillable.toFixed(1)}h</p>
          </div>
        </div>

        {/* Entries */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_80px_80px_80px] gap-4 px-4 py-2 border-b border-border text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Task</span><span>Description</span><span>Hours</span><span>Date</span><span>Type</span>
          </div>
          {timeEntries.map(entry => {
            const task = tasks.find(t => t.id === entry.taskId);
            return (
              <div key={entry.id} className="grid grid-cols-[1fr_1fr_80px_80px_80px] gap-4 px-4 py-3 border-b border-border/50 text-sm hover:bg-muted/30 transition-colors">
                <span className="text-card-foreground font-medium truncate">{task?.title || 'Unknown'}</span>
                <span className="text-muted-foreground truncate">{entry.description}</span>
                <span className="font-display text-card-foreground">{entry.hours}h</span>
                <span className="text-muted-foreground text-xs">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className={`text-xs font-medium ${entry.billable ? 'text-success' : 'text-muted-foreground'}`}>
                  {entry.billable ? 'Billable' : 'Internal'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
