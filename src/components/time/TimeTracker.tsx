import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import * as timeEntriesApi from '@/api/timeEntries';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map(n => n.toString().padStart(2, '0')).join(':');
}

export function TimeTracker() {
  const { tasks, projects, addTimeEntry, currentUserId } = useApp();
  const [running, setRunning] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tasksInProject = projectId
    ? tasks.filter(t => t.projectId === projectId)
    : [];

  const [timerStart, setTimerStart] = useState<string | null>(null);

  // Restore active timer from server (GET /api/time-entries/?user_id=xxx → find timer_running: true)
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const active = await timeEntriesApi.getActiveTimer(currentUserId);
        if (active?.timer_start) {
          setProjectId(active.project_id ?? '');
          setTaskId(active.task_id);
          setDescription(active.description ?? '');
          setBillable(active.billable ?? true);
          setTimerStart(active.timer_start);
          setRunning(true);
        }
      } catch {
        /* API not available */
      }
    })();
  }, [currentUserId]);

  // Live clock: recalc elapsed from timer_start every second (server is source of truth)
  useEffect(() => {
    if (running && timerStart) {
      const tick = () => {
        const elapsedSec = Math.floor((Date.now() - new Date(timerStart).getTime()) / 1000);
        setElapsed(elapsedSec);
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, timerStart]);

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    setTaskId(prev => {
      if (!id) return '';
      const task = tasks.find(t => t.id === prev);
      return task?.projectId === id ? prev : '';
    });
  };

  const handleStart = async () => {
    if (!projectId) {
      toast.error('Please select a project first');
      return;
    }
    if (!taskId) {
      toast.error('Please select a task first');
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    try {
      const res = await timeEntriesApi.startTimer({
        task_id: taskId,
        user_id: currentUserId,
        project_id: task?.projectId ?? projectId,
        description: description || 'Timer',
        billable,
      });
      const startedAt = res?.started_at ?? res?.timer_start ?? new Date().toISOString();
      setTimerStart(startedAt);
      setRunning(true);
    } catch (err) {
      console.warn('Start timer API failed:', err);
      toast.error('Failed to start timer. Ensure the Time API is running on port 8000.');
    }
  };

  const handleStop = async () => {
    if (!running) return;
    setRunning(false);
    setTimerStart(null);
    try {
      const entry = await timeEntriesApi.stopTimer({
        task_id: taskId,
        user_id: currentUserId,
        description: description || 'Timer',
        billable,
      });
      addTimeEntry(entry);
      toast.success(`Logged ${entry.hours.toFixed(2)}h`);
    } catch {
      toast.error('Failed to save timer. Backend calculates hours from timer_start.');
      const hours = Math.round(elapsed / 36) / 100;
      if (hours > 0) {
        addTimeEntry({
          taskId,
          userId: currentUserId,
          hours,
          date: new Date().toISOString().slice(0, 10),
          description: description || 'Timer',
          billable,
        });
        toast.success(`Logged ${hours.toFixed(2)}h (local fallback)`);
      }
    }
    setElapsed(0);
  };

  return (
    <div className="p-5 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={running ? handleStop : handleStart}
          className={`p-3 rounded-lg transition-colors shrink-0 ${
            running ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {running ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <div>
          <p className="text-3xl font-display font-bold text-card-foreground tracking-wider tabular-nums">
            {formatElapsed(elapsed)}
          </p>
          <p className="text-xs text-muted-foreground">{running ? 'Timer running...' : 'Select project, then task & click play to start'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-wrap items-center gap-3">
        <div className="min-w-[160px]">
          <Select value={projectId} onValueChange={handleProjectChange} disabled={running}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <Select value={taskId} onValueChange={setTaskId} disabled={running || !projectId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder={projectId ? 'Select task' : 'Select project first'} />
            </SelectTrigger>
            <SelectContent>
              {tasksInProject.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="h-9 w-[160px] text-xs"
          disabled={running}
        />
        <div className="flex items-center gap-2">
          <Checkbox id="timer-billable" checked={billable} onCheckedChange={v => setBillable(!!v)} disabled={running} />
          <Label htmlFor="timer-billable" className="text-xs cursor-pointer">Billable</Label>
        </div>
      </div>
    </div>
  );
}
