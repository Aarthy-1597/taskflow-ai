import { Task, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG, TaskPriority } from '@/data/types';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Calendar, Flag, Link2, MessageSquare, Paperclip, Tag, Trash2, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { listTaskCommentsApi, addTaskCommentApi } from '@/lib/api';

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskQuickEdit({ task, open, onOpenChange }: Props) {
  const {
    tasks,
    teamMembers,
    updateTask,
    addTaskAttachment,
    removeTaskAttachment,
    downloadTaskAttachment,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setTaskBlockedBy,
    deleteTask,
  } = useApp();

  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [comments, setComments] = useState<{ id: string; userId: string; content: string; createdAt: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [statusChangeCommentOpen, setStatusChangeCommentOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ newStatus: TaskStatus } | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState('');

  const currentTask = useMemo(() => {
    if (!task) return null;
    return tasks.find(t => t.id === task.id) ?? task;
  }, [task, tasks]);

  useEffect(() => {
    if (!open) return;
    setNewLabel('');
    setNewSubtask('');
    setNewComment('');
    if (task?.id && import.meta.env.VITE_API_URL) {
      setCommentsLoading(true);
      listTaskCommentsApi(task.id)
        .then(comments => {
          setComments(comments);
          updateTask(task.id, { commentCount: comments.length });
        })
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));
    } else {
      setComments([]);
    }
  }, [open, task?.id]);

  const projectTasks = useMemo(
    () => (currentTask ? tasks.filter(t => t.projectId === currentTask.projectId && t.id !== currentTask.id) : []),
    [tasks, currentTask]
  );
  const activeBlockers = useMemo(() => {
    if (!currentTask) return [];
    const blockerSet = new Set(currentTask.blockedBy);
    return tasks.filter(t => blockerSet.has(t.id) && t.status !== 'done');
  }, [currentTask?.blockedBy, tasks, currentTask]);

  const handleChange = <K extends keyof Task>(field: K, value: Task[K]) => {
    updateTask(currentTask.id, { [field]: value } as Partial<Task>);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const comment = statusChangeReason.trim() || 'Status updated';
    updateTask(currentTask.id, { status: pendingStatusChange.newStatus });
    setPendingStatusChange(null);
    setStatusChangeCommentOpen(false);
    setStatusChangeReason('');
    try {
      await addTaskCommentApi(currentTask.id, comment);
      setComments(prev => [{ id: 'temp', userId: '', content: comment, createdAt: new Date().toISOString() }, ...prev]);
      updateTask(currentTask.id, { commentCount: (currentTask.commentCount ?? 0) + 1 });
    } catch {
      // Status already updated locally
    }
  };

  const cancelStatusChange = () => {
    setPendingStatusChange(null);
    setStatusChangeCommentOpen(false);
    setStatusChangeReason('');
  };

  const isBlocked = currentTask ? activeBlockers.length > 0 && currentTask.status !== 'done' : false;

  if (!currentTask) return null;

  const toggleAssignee = (id: string) => {
    const next = currentTask.assignees.includes(id) ? currentTask.assignees.filter(x => x !== id) : [...currentTask.assignees, id];
    handleChange('assignees', next);
  };

  const toggleBlocker = (blockerId: string) => {
    const next = currentTask.blockedBy.includes(blockerId)
      ? currentTask.blockedBy.filter(x => x !== blockerId)
      : [...currentTask.blockedBy, blockerId];
    setTaskBlockedBy(currentTask.id, next);
  };

  const addLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (currentTask.labels.includes(trimmed)) {
      setNewLabel('');
      return;
    }
    handleChange('labels', [...currentTask.labels, trimmed]);
    setNewLabel('');
  };

  const removeLabel = (label: string) => {
    handleChange('labels', currentTask.labels.filter(l => l !== label));
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const list = Array.from(files);
      for (const f of list) await addTaskAttachment(currentTask.id, f);
      toast.success(`Attached ${list.length} file${list.length === 1 ? '' : 's'}`);
    } catch (e) {
      toast.error((e as Error)?.message || 'Failed to attach file');
    }
  };

  const download = async (attachmentId: string, name: string) => {
    const blob = await downloadTaskAttachment(attachmentId);
    if (!blob) {
      toast.error('Attachment data is not available (demo item).');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addSubtaskLocal = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    addSubtask(currentTask.id, trimmed);
    setNewSubtask('');
  };

  const addComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    if (!import.meta.env.VITE_API_URL) {
      toast.info('API not configured');
      return;
    }
    try {
      const created = await addTaskCommentApi(currentTask.id, trimmed);
      setComments(prev => [created, ...prev]);
      setNewComment('');
      updateTask(currentTask.id, { commentCount: (currentTask.commentCount ?? 0) + 1 });
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Edit Task</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <Input
              defaultValue={currentTask.title}
              onBlur={e => handleChange('title', e.target.value)}
              className="text-sm font-medium"
              placeholder="Task title"
            />
            <Textarea
              defaultValue={currentTask.description}
              onBlur={e => handleChange('description', e.target.value)}
              placeholder="Description..."
              rows={4}
              className="resize-none text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Flag className="h-3 w-3" /> Status</label>
                <Select
                  value={currentTask.status}
                  onValueChange={v => {
                    if (import.meta.env.VITE_API_URL) {
                      setPendingStatusChange({ newStatus: v as TaskStatus });
                      setStatusChangeCommentOpen(true);
                    } else {
                      handleChange('status', v as TaskStatus);
                    }
                  }}
                >
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
                {isBlocked && (
                  <div className="mt-2 flex items-start gap-2 text-[11px] text-warning">
                    <Link2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Blocked by {activeBlockers.length} unfinished task{activeBlockers.length === 1 ? '' : 's'}.</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Tag className="h-3 w-3" /> Priority</label>
                <Select value={currentTask.priority} onValueChange={v => handleChange('priority', v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, { label: string; colorClass: string }][])
                      .map(([k, v]) => (
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
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</label>
                <Input
                  type="date"
                  value={currentTask.dueDate}
                  onChange={e => handleChange('dueDate', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><User className="h-3 w-3" /> Assignees</label>
              <ScrollArea className="h-44 rounded-md border border-border">
                <div className="p-3 space-y-2">
                  {teamMembers.map(m => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleAssignee(m.id)}
                      className="w-full flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar userId={m.id} />
                        <div className="min-w-0 text-left">
                          <div className="text-sm text-card-foreground truncate">{m.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{m.email}</div>
                        </div>
                      </div>
                      <Checkbox checked={currentTask.assignees.includes(m.id)} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
              <div className="flex items-center gap-2">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                  placeholder="Bug, Feature, Design…"
                />
                <Button type="button" variant="secondary" onClick={addLabel}>Add</Button>
              </div>
              {currentTask.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentTask.labels.map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => removeLabel(label)}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:bg-muted/70"
                      title="Remove tag"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip className="h-3 w-3" /> Attachments</label>
              <Input type="file" multiple onChange={(e) => void onUpload(e.target.files)} />
              {currentTask.attachments.length > 0 ? (
                <div className="space-y-2">
                  {currentTask.attachments.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void download(a.id, a.name)}
                        className="min-w-0 text-left"
                        title="Download"
                      >
                        <div className="text-sm text-card-foreground truncate">{a.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{Math.round(a.size / 1024)} KB</div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void removeTaskAttachment(currentTask.id, a.id)}
                        title="Remove attachment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No attachments yet.</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Subtasks</label>
              <div className="flex items-center gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubtaskLocal();
                    }
                  }}
                  placeholder="Add a subtask…"
                />
                <Button type="button" variant="secondary" onClick={addSubtaskLocal}>Add</Button>
              </div>
              {currentTask.subtasks.length > 0 ? (
                <div className="space-y-2">
                  {currentTask.subtasks.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(currentTask.id, s.id)}
                        className="flex items-center gap-2 min-w-0"
                      >
                        <Checkbox checked={s.done} />
                        <span className={`text-sm truncate ${s.done ? 'line-through text-muted-foreground' : 'text-card-foreground'}`}>
                          {s.title}
                        </span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSubtask(currentTask.id, s.id)}
                        title="Delete subtask"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">No subtasks yet.</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comments <span className="text-foreground font-medium">({commentsLoading ? '…' : comments.length})</span></label>
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      addComment();
                    }
                  }}
                  placeholder="Add a comment..."
                  className="text-sm"
                />
                <Button type="button" variant="secondary" onClick={addComment} disabled={!newComment.trim()}>
                  Add
                </Button>
              </div>
              {commentsLoading ? (
                <div className="text-xs text-muted-foreground">Loading comments...</div>
              ) : comments.length > 0 ? (
                <ScrollArea className="h-32 rounded-md border border-border">
                  <div className="p-3 space-y-3">
                    {comments.map(c => {
                      const member = teamMembers.find(m => m.id === c.userId);
                      return (
                        <div key={c.id} className="flex gap-2">
                          <UserAvatar userId={c.userId} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-card-foreground">{member?.name ?? 'Unknown'}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-xs text-muted-foreground py-2">No comments yet.</div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Link2 className="h-3 w-3" /> Blocked by (optional)</label>
              <ScrollArea className="h-44 rounded-md border border-border">
                <div className="p-3 space-y-2">
                  {projectTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground">No other tasks in this project.</div>
                  )}
                  {projectTasks.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => toggleBlocker(t.id)}
                      className="w-full flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0 text-left">
                        <div className="text-sm text-card-foreground truncate">{t.title}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{STATUS_CONFIG[t.status].label}</div>
                      </div>
                      <Checkbox checked={currentTask.blockedBy.includes(t.id)} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="pt-1">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  deleteTask(currentTask.id);
                  onOpenChange(false);
                  toast.success('Task deleted');
                }}
                className="w-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={statusChangeCommentOpen} onOpenChange={open => !open && cancelStatusChange()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comment for status change</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Changing status to <strong>{pendingStatusChange && STATUS_CONFIG[pendingStatusChange.newStatus]?.label}</strong>. Add a comment (optional):
        </p>
        <Textarea
          value={statusChangeReason}
          onChange={e => setStatusChangeReason(e.target.value)}
          placeholder="Reason or comment..."
          rows={3}
          className="resize-none"
        />
        <DialogFooter>
          <Button variant="outline" onClick={cancelStatusChange}>Cancel</Button>
          <Button onClick={() => void confirmStatusChange()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
