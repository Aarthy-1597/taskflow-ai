import { useState } from 'react';
import { Task, TaskStatus, TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '@/data/types';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { teamMembers } from '@/data/mockData';
import { Calendar, Tag, User, Flag } from 'lucide-react';

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskQuickEdit({ task, open, onOpenChange }: Props) {
  const { updateTask } = useApp();

  if (!task) return null;

  const handleChange = (field: keyof Task, value: string) => {
    updateTask(task.id, { [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            defaultValue={task.title}
            onBlur={e => handleChange('title', e.target.value)}
            className="text-sm font-medium"
            placeholder="Task title"
          />
          <Textarea
            defaultValue={task.description}
            onBlur={e => handleChange('description', e.target.value)}
            placeholder="Description..."
            rows={3}
            className="resize-none text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Flag className="h-3 w-3" /> Status</label>
              <Select defaultValue={task.status} onValueChange={v => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${v.colorClass}`} />
                        {v.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Tag className="h-3 w-3" /> Priority</label>
              <Select defaultValue={task.priority} onValueChange={v => handleChange('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${v.colorClass}`} />
                        {v.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Assignee</label>
              <Select defaultValue={task.assignee} onValueChange={v => handleChange('assignee', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {teamMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <UserAvatar userId={m.id} />
                        <span>{m.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</label>
              <Input
                type="date"
                defaultValue={task.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Labels</label>
            <div className="flex flex-wrap gap-1">
              {task.labels.map(label => (
                <span key={label} className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{label}</span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
