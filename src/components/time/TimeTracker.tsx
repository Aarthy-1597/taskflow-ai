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
  const { tasks, addTimeEntry, currentUserId } = useApp();
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [usingApiTimer, setUsingApiTimer] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const handleStart = async () => {
    if (!taskId) {
      toast.error('Please select a task first');
      return;
    }
    const task = tasks.find(t => t.id === taskId);
    try {
      await timeEntriesApi.startTimer({
        task_id: taskId,
        user_id: currentUserId,
        project_id: task?.projectId ?? '',
        description: description || 'Timer',
        billable,
      });
      setUsingApiTimer(true);
      setRunning(true);
    } catch {
      setUsingApiTimer(false);
      setRunning(true);
    }
  };

  const handleStop = async () => {
    if (!running) return;
    setRunning(false);
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
          <p className="text-xs text-muted-foreground">{running ? 'Timer running...' : 'Select task & click play to start'}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <Select value={taskId} onValueChange={setTaskId} disabled={running}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map(t => (
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
