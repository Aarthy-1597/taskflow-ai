import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import * as timeEntriesApi from '@/api/timeEntries';

const ACTIVE_TIMER_STORAGE_KEY = 'taskflow-active-timer';

interface StoredActiveTimer {
  taskId: string;
  projectId: string;
  description: string;
  billable: boolean;
  startedAt: string;
  userId: string;
}

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
  const [usingApiTimer, setUsingApiTimer] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tasksInProject = projectId
    ? tasks.filter(t => t.projectId === projectId)
    : [];

  // Restore active timer on mount (API first, then localStorage fallback)
  useEffect(() => {
    if (!currentUserId) return;
    let restored = false;

    const restoreFromApi = async () => {
      try {
        const active = await timeEntriesApi.getActiveTimer(currentUserId);
        if (active?.started_at) {
          const startedAt = new Date(active.started_at).getTime();
          const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
          setProjectId(active.project_id ?? '');
          setTaskId(active.task_id);
          setDescription(active.description ?? '');
          setBillable(active.billable ?? true);
          setElapsed(elapsedSec);
          setUsingApiTimer(true);
          setRunning(true);
          restored = true;
        }
      } catch {
        /* API not available */
      }
    };

    const restoreFromStorage = () => {
      if (restored) return;
      try {
        const raw = localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
        if (!raw) return;
        const stored: StoredActiveTimer = JSON.parse(raw);
        if (stored.userId !== currentUserId) return;
        const startedAt = new Date(stored.startedAt).getTime();
        const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
        setProjectId(stored.projectId);
        setTaskId(stored.taskId);
        setDescription(stored.description);
        setBillable(stored.billable);
        setElapsed(elapsedSec);
        setUsingApiTimer(false);
        setRunning(true);
      } catch {
        localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
      }
    };

    restoreFromApi().then(restoreFromStorage);
  }, [currentUserId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

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
        project_id: task?.projectId ?? '',
        description: description || 'Timer',
        billable,
      });
      setUsingApiTimer(true);
      setRunning(true);
      const startedAt = res?.started_at ?? new Date().toISOString();
      const stored: StoredActiveTimer = {
        taskId,
        projectId: task?.projectId ?? projectId,
        description: description || 'Timer',
        billable,
        startedAt,
        userId: currentUserId,
      };
      localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      setUsingApiTimer(false);
      setRunning(true);
      const stored: StoredActiveTimer = {
        taskId,
        projectId: task?.projectId ?? projectId,
        description: description || 'Timer',
        billable,
        startedAt: new Date().toISOString(),
        userId: currentUserId,
      };
      localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(stored));
    }
  };

  const handleStop = async () => {
    if (!running) return;
    setRunning(false);
    localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
    if (usingApiTimer) {
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
        toast.error('Failed to save timer. Logging locally.');
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
          toast.success(`Logged ${hours.toFixed(2)}h`);
        }
      }
    } else {
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
        toast.success(`Logged ${hours.toFixed(2)}h`);
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
