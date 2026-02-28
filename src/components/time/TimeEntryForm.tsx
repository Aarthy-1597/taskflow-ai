import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { TimeEntry } from '@/data/types';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TimeEntry | null;
}

export function TimeEntryForm({ open, onOpenChange, entry }: Props) {
  const { tasks, projects, addTimeEntry, updateTimeEntry, currentUserId } = useApp();
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState(entry?.taskId ?? '');
  const [hours, setHours] = useState(entry ? String(entry.hours) : '');
  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(entry?.description ?? '');
  const [billable, setBillable] = useState(entry?.billable ?? true);

  const isEdit = !!entry;
  const tasksInProject = projectId ? tasks.filter(t => t.projectId === projectId) : [];

  const handleProjectChange = (id: string) => {
    setProjectId(id);
    setTaskId(prev => {
      if (!id) return '';
      const task = tasks.find(t => t.id === prev);
      return task?.projectId === id ? prev : '';
    });
  };

  useEffect(() => {
    if (!open) return;
    if (entry) {
      const task = tasks.find(t => t.id === entry.taskId);
      setProjectId(task?.projectId ?? '');
      setTaskId(entry.taskId);
      setHours(String(entry.hours));
      setDate(entry.date);
      setDescription(entry.description);
      setBillable(entry.billable);
    } else {
      setProjectId('');
      setTaskId('');
      setHours('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setBillable(true);
    }
  }, [entry, open, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    if (!projectId) {
      toast.error('Please select a project');
      return;
    }
    if (!taskId) {
      toast.error('Please select a task');
      return;
    }
    if (isNaN(h) || h <= 0) {
      toast.error('Please enter valid hours (e.g. 1.5)');
      return;
    }
    if (!date) {
      toast.error('Please select a date');
      return;
    }

    if (isEdit) {
      updateTimeEntry(entry.id, { taskId, hours: h, date, description, billable });
      toast.success('Time entry updated');
    } else {
      addTimeEntry({ taskId, userId: currentUserId, projectId, hours: h, date, description, billable });
      toast.success('Time entry added');
    }
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setProjectId('');
    setTaskId('');
    setHours('');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setBillable(true);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? 'Edit Time Entry' : 'Log Time'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Project</Label>
            <Select value={projectId} onValueChange={handleProjectChange} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Task</Label>
            <Select value={taskId} onValueChange={setTaskId} required disabled={!projectId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={projectId ? 'Select task' : 'Select project first'} />
              </SelectTrigger>
              <SelectContent>
                {tasksInProject.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Hours (decimal, e.g. 1.5)</Label>
            <Input
              type="number"
              step="0.25"
              min="0.1"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="1.5"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="billable" checked={billable} onCheckedChange={v => setBillable(!!v)} />
            <Label htmlFor="billable" className="text-sm cursor-pointer">Billable</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Update' : 'Add Entry'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
